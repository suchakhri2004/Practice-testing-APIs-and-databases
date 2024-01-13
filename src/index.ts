import  express  from "express";
import { Pool } from "pg";
import cors from "cors";
import bcrypt from "bcrypt";

const app = express();
const port = 3000;

app.use (cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// เชื่อมต่อกับ database
const pool = new Pool({
    user : 'postgres',
    host : 'localhost',
    database : 'dbstock',
    password : '1234',
    port : 5432
})

// get ดึงค่ามาแสดงผล
app.get('/',async (req,res)=>{
    try {
        const client = await pool.connect()  // connect ฐานข้อมูล
       res.send('Hello World')
       client.release()    // คืน connection

    } catch (error) {
        console.error('Error connecting to the database:', error);
        res.status(500).send('Internal Server Error');
    }
})

app.get('/products',async (req,res)=>{
    try {
        const client = await pool.connect()
    const result = await client.query('select * from products') //เลือกฐานข้อมูล products ทั้งหมด
    const data = result.rows //ตารางทั้งหมดของฐานข้อมูล
    res.json(data) //แสดงตารางออกมาเป็น json
    client.release()

    } catch (error) {
        console.error('Error fetching products from the database:', error);
        res.status(500).send('Internal Server Error');
    }
})  

//post ส่งข้อมูลเข้า
app.post('/addproduct',async (req,res)=>{
  try {
    const client = await pool.connect()
    const result = await client.query('INSERT INTO products(id,name) values($1,$2) RETURNING *',[req.body.id,req.body.name])
    res.send(`add product ${req.body.name } complete`)
    client.release()

  } catch (error) {
    console.error('Error adding product to the database:', error);
        res.status(500).send('Internal Server Error');
  }
    
})

// put อัปเดตข้อมูล
app.put('/updateproduct/:id',async(req,res)=>{
    try {
        const client = await pool.connect()
    const  result = await client.query('SELECT id FROM products WHERE id = $1',[req.params.id])
    if (result.rows.length > 0){
        const updateResult = await client.query('UPDATE products SET name = $2 WHERE id = $1 RETURNING *',[req.params.id,req.body.name])
        res.send(`update product ${req.body.name} complete`)
    }else{
        res.send(`${req.params.id } not found`)
    }
    client.release()
        
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).send('Internal Server Error');
    }
    
})
// delete ลบข้อมูล
app.delete('/deleteproduct/:id',async(req,res)=>{
    try {
    const client = await pool.connect()
    const result = await client.query('SELECT id FROM products WHERE id = $1',[req.params.id])

    if (result.rows.length > 0){
        const deleteResult = await client.query('DELETE FROM products WHERE id = $1',[req.params.id])
        res.send(`delete product ${req.body.name} complete`)
    }else{
        res.send(`${req.params.id } not found`)
    }
    client.release()
    
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).send('Internal Server Error');
    }
    
})

app.post('/register',async(req,res)=>{
        const client = await pool.connect()
    const hashPassword = await bcrypt.hash(req.body.password,10)  // ทำรหัสให้เป็น hashpassword 
    // RETURNING คือการส่งข้อมูลกลับไปในตาราง database
    const result = await client.query('INSERT INTO users(username,password,role) values($1,$2,$3) RETURNING *',[req.body.username,hashPassword,req.body.role])
    res.send('user complete')
    client.release()

})

app.post('/login',async(req,res)=>{

        const client = await pool.connect()
    const result = await client.query('SELECT * FROM users WHERE username = $1',[req.body.username])
    //ตรวจเช็ค username
    if (result.rows.length === 0){
        return res.status(404).json({error:'Invalid credentials'})
    }
    const user = result.rows[0] // ถ้าตรงกับที่มีให้เก็บข้อมูลไปที่ user
    const passwordMatch = await bcrypt.compare(req.body.password,user.password) //การเปรียบเทียบค่ารหัสผ่าน
    // ถ้ารหัสผ่านตรงให้ แสดงผลสำเร็จ ถ้าไม่ตรง ก็ error
    if(passwordMatch){
        res.json({message:"Login sucessfullty"})
    }else {
        return res.status(404).json({error:'Invalid credentials'})
    }
    client.release()
})





app.listen(port,()=>{
console.log(`Server is running on port ${port}`);
});
