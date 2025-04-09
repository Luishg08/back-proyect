const { PrismaClient } = require('@prisma/client'); //Importamos el cliente de prisma
const prisma = new PrismaClient(); // Creamos una instancia del cliente de Prisma
const csv = require('csv-parser');
const { Readable } = require('stream'); 
const logger = require('../middlewares/log'); 

const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Upload a CSV file' });
  }

  const resultados = [];
  const stream = Readable.from(req.file.buffer);

  stream
    .pipe(csv())
    .on('data', (fila) => {
      if (!fila.DEPARTAMENTO || !fila.MUNICIPIO) {
        logger.error(`Invalid data in row: ${JSON.stringify(fila)}`);
      } else {
        logger.info(`Processing row: ${JSON.stringify(fila)}`);
        resultados.push(fila);
      }
    })
    .on('end', async () => {
      const departamentosUnicos = Array.from(
        new Set(resultados.map(fila => fila.DEPARTAMENTO))
      ).map(name => ({ name }));

      const departamentosExistentes = await prisma.department.findMany({
        where: {
          name: {
            in: departamentosUnicos.map(dep => dep.name)
          }
        },
        select: { id: true, name: true }
      });

      const departamentosMap = departamentosExistentes.reduce((acc, dep) => {
        acc[dep.name] = dep.id;
        return acc;
      }, {});

      const departamentosNuevos = departamentosUnicos.filter(
        dep => !departamentosMap[dep.name]
      );

      if (departamentosNuevos.length > 0) {
        await prisma.department.createMany({
          data: departamentosNuevos,
        });
      }

      const departamentosFinales = await prisma.department.findMany({
        where: {
          name: {
            in: departamentosUnicos.map(dep => dep.name),
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      const departamentosFinalesMap = departamentosFinales.reduce((acc, dep) => {
        acc[dep.name] = dep.id;
        return acc;
      }, {});

      const ciudadesUnicas = Array.from(
        new Map(
          resultados.map(fila => [
            `${fila.MUNICIPIO}-${fila.DEPARTAMENTO}`,
            {
              name: fila.MUNICIPIO,
              departmentId: departamentosFinalesMap[fila.DEPARTAMENTO],
            },
          ])
        ).values()
      );
      
      const ciudadesExistentes = await prisma.city.findMany({
        where: {
          OR: ciudadesUnicas.map(ciudad => ({
            name: ciudad.name,
            departmentId: ciudad.departmentId,
          })),
        },
        select: {
          name: true,
          departmentId: true,
        },
      });
      
      const ciudadExistenteSet = new Set(
        ciudadesExistentes.map(c => `${c.name}-${c.departmentId}`)
      );
      
      const ciudadesNuevas = ciudadesUnicas.filter(
        c => !ciudadExistenteSet.has(`${c.name}-${c.departmentId}`)
      );
      
      if (ciudadesNuevas.length > 0) {
        await prisma.city.createMany({
          data: ciudadesNuevas,
        });
      }
      logger.info(`Departments and cities created/updated successfully`);
      res.json({
        mensaje: 'Departments and cities created/updated successfully',
        filas: resultados.length,
      });
    })
    .on('error', (err) => {
      logger.error(`Error processing CSV data: ${err.message}`);
      res.status(500).json({ error: 'Processing data error', error: err.message });
    });
};

const getCiudades = async (req, res) => {
  try {
    const ciudades = await prisma.city.findMany({
      include: {
        department: true,
      },
    });

    const data = ciudades.map(ciudad => ({
      departamento: ciudad.department.name,
      municipio: ciudad.name,
    }));

    res.json(data);
  } catch (error) {
    console.error('Error al obtener ciudades:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};



module.exports = {
    uploadFile,
    getCiudades
}