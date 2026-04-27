// require("dotenv/config")
// const { PrismaMariaDb } =  require('@prisma/adapter-mariadb');
// const { PrismaClient } = require('@prisma/client');

// const adapter = new PrismaMariaDb({
//   host: process.env.DATABASE_HOST,
//   user: process.env.DATABASE_USER,
//   password: process.env.DATABASE_PASSWORD,
//   database: process.env.DATABASE_NAME
// });
// const prisma = new PrismaClient({ adapter });

// module.exports = {prisma}

require("dotenv/config");
const { PrismaPg } = require("@prisma/adapter-pg");
const  { PrismaClient } = require("@prisma/client") ;

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
module.exports = {prisma}

// require("dotenv").config();

// const { PrismaPg } = require("@prisma/adapter-pg");
// const { PrismaClient } = require("../generated/prisma/client");

// const connectionString = process.env.DATABASE_URL;

// const adapter = new PrismaPg({ connectionString });
// const prisma = new PrismaClient({ adapter });

// module.exports = { prisma };