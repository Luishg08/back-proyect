const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.users.findMany();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({
        message: "Failed to fetch users",
        error: error.message,
        });
    }
    };

module.exports = {
    getAllUsers
    };