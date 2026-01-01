const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

/*const credits = `// ==============================================
// 𝌙 Itsuki Nakano Wabot V4 𝌙
// ==============================================
// 💎 Creado por: FzTeis
// 🌸 Adaptado para: Itsuki Nakano IA V4
// 👨‍💻 Usado por: leoxitoDev.xyz
// 📱 Base: Baileys (@whiskeysockets/baileys = "npm:wileys")
// ⚡ Versión: ^NewUpdate | V4
// ==============================================
`;*/

const filesToObfuscate = [
  'code.js',
  'setfooter.js',
  'setimage.js',
  'setimgdoc.js',
  'setname.js',
  'setprefix.js',
  'subbots.js'
];

filesToObfuscate.forEach(file => {
  const filePath = path.join(__dirname, file);
  const backupPath = path.join(__dirname, `${file}.backup`);

  if (!fs.existsSync(backupPath)) {
    console.log(`⚠️  Backup not found for ${file}, skipping`);
    return;
  }

  try {
    const sourceCode = fs.readFileSync(backupPath, 'utf8');

    const obfuscationResult = JavaScriptObfuscator.obfuscate(sourceCode, {
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.75,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.4,
      debugProtection: false,
      debugProtectionInterval: 0,
      disableConsoleOutput: false,
      identifierNamesGenerator: 'mangled',
      log: false,
      numbersToExpressions: true,
      renameGlobals: false,
      rotateStringArray: true,
      selfDefending: true,
      shuffleStringArray: true,
      simplify: true,
      splitStrings: true,
      splitStringsChunkLength: 10,
      stringArray: true,
      stringArrayEncoding: ['rc4'],
      stringArrayIndexShift: true,
      stringArrayWrappersCount: 2,
      stringArrayWrappersChainedCalls: true,
      stringArrayWrappersParametersMaxCount: 4,
      stringArrayWrappersType: 'function',
      stringArrayThreshold: 0.75,
      transformObjectKeys: true,
      unicodeEscapeSequence: false
    });

    const finalCode = credits + obfuscationResult.getObfuscatedCode();
    fs.writeFileSync(filePath, finalCode, 'utf8');

    console.log(`✅ Successfully obfuscated: ${file}`);
  } catch (error) {
    console.error(`❌ Error obfuscating ${file}:`, error.message);
  }
});

console.log('\n🎉 Obfuscation complete!');
