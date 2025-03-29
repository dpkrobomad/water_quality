module.exports = {
  apps: [{
    name: "water-quality-monitor",
    script: "npm",
    args: "run dev",
    interpreter: "none", // Important for npm commands
    env: {
      NODE_ENV: "production",
      PORT: 3000
    }
   
  }]
} 
