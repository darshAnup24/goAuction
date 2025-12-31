// Migration script to fix existing users with null emailVerified
// Run this to update existing users so they can login

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migrateUsers() {
  try {
    console.log('🔄 Starting user migration...')
    
    // Find all users with null emailVerified
    const usersToUpdate = await prisma.user.findMany({
      where: {
        emailVerified: null,
        password: { not: '' }, // Only update users with passwords (not OAuth)
      },
      select: {
        id: true,
        email: true,
        username: true,
      },
    })

    console.log(`📊 Found ${usersToUpdate.length} users to update`)

    if (usersToUpdate.length === 0) {
      console.log('✅ No users need migration!')
      return
    }

    // Update all users to be verified
    const result = await prisma.user.updateMany({
      where: {
        emailVerified: null,
        password: { not: '' },
      },
      data: {
        emailVerified: new Date(),
      },
    })

    console.log(`✅ Successfully updated ${result.count} users!`)
    console.log('📧 Users can now login with their credentials')
    
    // List updated users
    console.log('\n📋 Updated users:')
    usersToUpdate.forEach(user => {
      console.log(`  - ${user.email} (${user.username})`)
    })

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateUsers()
  .then(() => {
    console.log('\n🎉 Migration completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error)
    process.exit(1)
  })
