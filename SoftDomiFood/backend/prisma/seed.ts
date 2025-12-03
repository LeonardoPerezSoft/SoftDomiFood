import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Limpiar datos existentes (opcional, para desarrollo)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Crear exactamente 5 productos de ejemplo
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Salchipapa Clásica',
        description: 'Papas fritas crujientes con salchichas, salsas (mayonesa, ketchup, mostaza) y queso rallado',
        price: 12000,
        category: 'SALCHIPAPAS',
        isAvailable: true
      }
    }),
    prisma.product.create({
      data: {
        name: 'Salchipapa Especial',
        description: 'Papas fritas con salchichas, pollo desmechado, chorizo, huevo frito y todas las salsas',
        price: 18000,
        category: 'SALCHIPAPAS',
        isAvailable: true
      }
    }),
    prisma.product.create({
      data: {
        name: 'Gaseosa',
        description: 'Gaseosa 350ml (Coca Cola, Pepsi, Sprite o 7UP)',
        price: 3000,
        category: 'BEBIDAS',
        isAvailable: true
      }
    }),
    prisma.product.create({
      data: {
        name: 'Jugo Natural',
        description: 'Jugo natural de frutas 500ml (Lulo, Mora, Maracuyá)',
        price: 4000,
        category: 'BEBIDAS',
        isAvailable: true
      }
    }),
    prisma.product.create({
      data: {
        name: 'Queso Extra',
        description: 'Porción adicional de queso rallado para tu salchipapa',
        price: 2000,
        category: 'ADICIONALES',
        isAvailable: true
      }
    })
  ]);

  console.log(`✅ Created ${products.length} products`);

  // Crear usuario admin de ejemplo
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@salchipapas.com',
      password: hashedAdminPassword,
      name: 'Admin',
      role: 'ADMIN'
    }
  });

  console.log('✅ Created admin user');
  console.log('📧 Email: admin@salchipapas.com');
  console.log('🔑 Password: admin123');

  // Crear usuario cliente para testing
  const hashedClientPassword = await bcrypt.hash('cliente123', 10);
  const client = await prisma.user.create({
    data: {
      email: 'cliente@test.com',
      password: hashedClientPassword,
      name: 'Cliente Test',
      phone: '+57 300 1234567',
      role: 'CUSTOMER'
    }
  });

  console.log('✅ Created client user for testing');
  console.log('📧 Email: cliente@test.com');
  console.log('🔑 Password: cliente123');

  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

