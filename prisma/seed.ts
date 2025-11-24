import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Las mismas categorías que se crean automáticamente al registrarse
const DEFAULT_HABIT_CATEGORIES = [
  { name: 'Salud', emoji: '💪', color: '#10b981' },
  { name: 'Productividad', emoji: '🚀', color: '#3b82f6' },
  { name: 'Aprendizaje', emoji: '📚', color: '#8b5cf6' },
  { name: 'Fitness', emoji: '🏃', color: '#f59e0b' },
  { name: 'Mindfulness', emoji: '🧘', color: '#06b6d4' },
  { name: 'Social', emoji: '👥', color: '#ec4899' },
  { name: 'Creatividad', emoji: '🎨', color: '#f59e0b' },
  { name: 'Nutrición', emoji: '🥗', color: '#10b981' },
  { name: 'Sueño', emoji: '😴', color: '#6366f1' },
  { name: 'Otro', emoji: '📁', color: '#64748b' },
];

const DEFAULT_TRANSACTION_CATEGORIES = [
  // Gastos
  { name: 'Alimentación', emoji: '🍔', type: 'expense' },
  { name: 'Transporte', emoji: '🚗', type: 'expense' },
  { name: 'Vivienda', emoji: '🏠', type: 'expense' },
  { name: 'Entretenimiento', emoji: '🎬', type: 'expense' },
  { name: 'Salud', emoji: '💊', type: 'expense' },
  { name: 'Educación', emoji: '📚', type: 'expense' },
  { name: 'Servicios', emoji: '💡', type: 'expense' },
  { name: 'Compras', emoji: '🛍️', type: 'expense' },
  { name: 'Viajes', emoji: '✈️', type: 'expense' },
  { name: 'Deportes', emoji: '⚽', type: 'expense' },
  { name: 'Tecnología', emoji: '💻', type: 'expense' },
  { name: 'Ropa', emoji: '👔', type: 'expense' },
  { name: 'Mascotas', emoji: '🐕', type: 'expense' },
  { name: 'Regalos', emoji: '🎁', type: 'expense' },
  { name: 'Otro Gasto', emoji: '💰', type: 'expense' },
  // Ingresos
  { name: 'Salario', emoji: '💼', type: 'income' },
  { name: 'Freelance', emoji: '💻', type: 'income' },
  { name: 'Inversiones', emoji: '📈', type: 'income' },
  { name: 'Negocio', emoji: '🏢', type: 'income' },
  { name: 'Bonos', emoji: '🎁', type: 'income' },
  { name: 'Ventas', emoji: '💵', type: 'income' },
  { name: 'Alquiler', emoji: '🏘️', type: 'income' },
  { name: 'Otro Ingreso', emoji: '💰', type: 'income' },
];

async function main() {
  console.log('🌱 Verificando usuarios sin categorías...\n');

  // Obtener todos los usuarios
  const users = await prisma.user.findMany();

  if (users.length === 0) {
    console.log('⚠️  No hay usuarios en la base de datos.');
    console.log('💡 Registra un usuario en http://localhost:3000/register');
    console.log('   Las categorías se crearán automáticamente al registrarse.\n');
    return;
  }

  let usersUpdated = 0;

  // Para cada usuario, verificar si tiene categorías
  for (const user of users) {
    const habitCategoriesCount = await prisma.habitCategory.count({
      where: { userId: user.id }
    });

    const transactionCategoriesCount = await prisma.transactionCategory.count({
      where: { userId: user.id }
    });

    if (habitCategoriesCount === 0 || transactionCategoriesCount === 0) {
      console.log(`\n👤 Usuario: ${user.email}`);
      
      // Agregar categorías de hábitos si no tiene
      if (habitCategoriesCount === 0) {
        await prisma.habitCategory.createMany({
          data: DEFAULT_HABIT_CATEGORIES.map(cat => ({
            ...cat,
            userId: user.id,
          })),
        });
        console.log(`   ✅ ${DEFAULT_HABIT_CATEGORIES.length} categorías de hábitos agregadas`);
      } else {
        console.log(`   ⏭️  Ya tiene ${habitCategoriesCount} categorías de hábitos`);
      }

      // Agregar categorías de transacciones si no tiene
      if (transactionCategoriesCount === 0) {
        await prisma.transactionCategory.createMany({
          data: DEFAULT_TRANSACTION_CATEGORIES.map(cat => ({
            ...cat,
            userId: user.id,
          })),
        });
        console.log(`   ✅ ${DEFAULT_TRANSACTION_CATEGORIES.length} categorías de transacciones agregadas`);
      } else {
        console.log(`   ⏭️  Ya tiene ${transactionCategoriesCount} categorías de transacciones`);
      }

      usersUpdated++;
    }
  }

  if (usersUpdated === 0) {
    console.log('\n✨ Todos los usuarios ya tienen sus categorías configuradas.\n');
  } else {
    console.log(`\n🎉 Seed completado! ${usersUpdated} usuario(s) actualizado(s).\n`);
  }

  console.log('💡 Nota: Los nuevos usuarios obtendrán estas categorías automáticamente al registrarse.\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
