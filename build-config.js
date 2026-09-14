// Build script: gera config.js com as variáveis de ambiente
// Roda automaticamente no deploy da Vercel (build command: npm run build)

const fs = require('fs');

const config = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'changeme123'
};

const output = `// Gerado automaticamente no build - NÃO EDITE MANUALMENTE
window.ENV_CONFIG = ${JSON.stringify(config, null, 2)};
`;

fs.writeFileSync('config.js', output);
console.log('✅ config.js gerado com variáveis de ambiente');