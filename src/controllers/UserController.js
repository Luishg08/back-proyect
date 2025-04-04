const { PrismaClient } = require('@prisma/client'); //Importamos el cliente de prisma
const prisma = new PrismaClient(); // Creamos una instancia del cliente de Prisma

const getAllUsers =async(req, res)=>{
    try{
        const users = await prisma.users.findMany(); // Fetch all users from the database
        res.status(200).json(users); // Send the users as a JSON response
    }catch (error) {
        console.log("Error fetching users:", error);
        res.status(500).json({
            message: "Failed fetching users",
            error: error.message
        }); 
    }

}

const getUserById=async(req,res)=>{
    const { id }=req.params; // Extract the user ID from the request parameters
    try{
        const user = await prisma.users.findUnique({
            where:{ id }
        });
        if(!user){
            return res.status(404).json({
                message:"User not found"
            });
        }
        res.status(200).json(user); // Send the user as a JSON response
    }catch(error){
        log.error("Error fetching user:", error);
        res.status(500).json({
            message: "Failed fetching user",
            error: error.message
        });
    }
}

module.exports = {
    getAllUsers,
    getUserById
}