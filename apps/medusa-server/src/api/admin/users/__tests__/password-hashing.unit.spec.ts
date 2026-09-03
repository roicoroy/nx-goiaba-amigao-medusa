import bcrypt from "bcrypt"

describe("Password Hashing with bcrypt", () => {
  it("should hash password with bcrypt", async () => {
    const password = "TestPassword123!"
    const saltRounds = 10
    
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    
    // Verify the hash is different from the original password
    expect(hashedPassword).not.toBe(password)
    
    // Verify the hash starts with bcrypt prefix
    expect(hashedPassword).toMatch(/^\$2[aby]\$/)
    
    // Verify we can compare the password with the hash
    const isMatch = await bcrypt.compare(password, hashedPassword)
    expect(isMatch).toBe(true)
    
    // Verify wrong password doesn't match
    const wrongMatch = await bcrypt.compare("WrongPassword", hashedPassword)
    expect(wrongMatch).toBe(false)
  })

  it("should use 10 salt rounds as specified in design", async () => {
    const password = "TestPassword123!"
    const saltRounds = 10
    
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    
    // bcrypt hash format: $2a$10$... where 10 is the cost factor (salt rounds)
    expect(hashedPassword).toMatch(/^\$2[aby]\$10\$/)
  })

  it("should generate different hashes for the same password", async () => {
    const password = "TestPassword123!"
    const saltRounds = 10
    
    const hash1 = await bcrypt.hash(password, saltRounds)
    const hash2 = await bcrypt.hash(password, saltRounds)
    
    // Different salts should produce different hashes
    expect(hash1).not.toBe(hash2)
    
    // But both should match the original password
    expect(await bcrypt.compare(password, hash1)).toBe(true)
    expect(await bcrypt.compare(password, hash2)).toBe(true)
  })
})
