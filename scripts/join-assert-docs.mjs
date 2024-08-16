import fs from 'fs/promises';
import path from 'path';

function extractJsDocContent(fileContent) {
  // Regex to match JSDoc comments
  const jsDocRegex = /\/\*\*[\s\S]*?\*\//g;
  // Find all JSDoc comments in the file content
  const jsDocMatches = fileContent.match(jsDocRegex);

  if (!jsDocMatches) {
    // Return an empty string if no JSDoc comments are found
    return '';
  }

  // Clean up and process each JSDoc comment
  const cleanedJsDocContent = jsDocMatches
    .map((jsDoc) => {
      // Remove the starting /** and ending */
      let cleanedJsDoc = jsDoc.replace(/^\/\*\*|\*\/$/g, '').trim();

      // Remove leading * from each line
      // cleanedJsDoc = cleanedJsDoc.replace(/(^|\n)\s*\*\s?/g, '\n').trim();

      // Find @example blocks and wrap them with code fences
      cleanedJsDoc = cleanedJsDoc.replace(/(@example[\s\S]*?)(\n\s*\* @)/g, (match, exampleContent, nextTag) => {
        // Add TypeScript code block markers
        return `@example\n\`\`\`typescript\n${exampleContent.replace(/^@example\s*/, '')}\`\`\`\n${nextTag}`;
      });

      cleanedJsDoc = cleanedJsDoc.replace(/(^|\n)\s*\*/g, '\n').trim();

      cleanedJsDoc = cleanedJsDoc.replace(/@example\s*/, '* _Example_\n').trim();

      cleanedJsDoc = cleanedJsDoc.replace(/@description\s*/, '* _Description_ ').trim();
      cleanedJsDoc = cleanedJsDoc.replace(/@param\s*/, '* _Param_ ').trim();
      cleanedJsDoc = cleanedJsDoc.replace(/@returns\s*/, '* _Returns_ ').trim();
      cleanedJsDoc = cleanedJsDoc.replace(/@translation\s*/, '* _See_ ').trim();
      cleanedJsDoc = cleanedJsDoc.replace(/@throws\s*/, '* _Throws_ ').trim();
      

      return cleanedJsDoc;
    })
    .join('\n\n'); // Separate different JSDoc blocks with a double newline

  return cleanedJsDocContent;
}

const run = async () => {
  let textData = '## Custom Assert Documentation \n';
  const dirs = await fs.readdir(path.join('src/asserts'));
  for (const dir of dirs) {
    textData += `\n### ${dir}\n`;
    const files = await fs.readdir(path.join('src/asserts', dir));
    for (const file of files) {
      if (file.endsWith('.ts') && file !== 'index.ts') {
        const fileData = await fs.readFile(path.join('src/asserts', dir, file));
        const fileName = path.parse(file).name;
        textData += `
        \n#### ${fileName}
        \n\`\`\`typescript\nimport { ${fileName} } from 'bguard/${dir}/${fileName}';\n\`\`\`
        \n${extractJsDocContent(fileData.toString())}
        \n
        `;
      }
    }
  }

  await fs.writeFile('Asserts.md', textData);
};

run();
