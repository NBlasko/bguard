import fs from 'fs/promises';
import path from 'path';

async function extractCommonTranslation() {
  const fileContent = await fs.readFile(path.join('src', 'translationMap.ts'));
  const regex = /\/\/@@start([\s\S]*?)\/\/@@end/g;
  const match = regex.exec(fileContent);
  if (!match) throw new Error('Something went wrong with Translation map');
  const contentBetweenTags = match[1].trim();
  if (!contentBetweenTags) throw new Error('Something went wrong with Translation map');

  const indentMatch = contentBetweenTags.match(/^\s*/);
  const indent = indentMatch ? indentMatch[0] : '';

  const formattedContent = contentBetweenTags
    .trim()
    .split('\n')
    .map((line) => indent + line.trim())
    .join('\n');
  return formattedContent;
}

function rearrangeArray(arr, priorities) {
  const prioritizedElements = priorities.map(priority => arr.filter(el => el === priority));
  const remainingElements = arr.filter(el => !priorities.includes(el));
  return [...prioritizedElements.flat(), ...remainingElements];
}

function extractJsDocContent(fileContent) {
  const jsDocRegex = /\/\*\*[\s\S]*?\*\//g;
  const jsDocMatches = fileContent.match(jsDocRegex);

  if (!jsDocMatches) {
    return '';
  }

  const cleanedJsDocContent = jsDocMatches
    .map((jsDoc) => {
      let cleanedJsDoc = jsDoc.replace(/^\/\*\*|\*\/$/g, '').trim();
      cleanedJsDoc = cleanedJsDoc.replace(/(@example[\s\S]*?)(\n\s*\* @)/g, (match, exampleContent, nextTag) => {
        return `@example\n\`\`\`typescript\n${exampleContent.replace(/^@example\s*/, '')}\`\`\`\n${nextTag}`;
      });

      cleanedJsDoc = cleanedJsDoc.replace(/(^|\n)\s*\*/g, '\n').trim();
      cleanedJsDoc = cleanedJsDoc.replace(/@description\s*/, '* _Description_ ').trim();
      cleanedJsDoc = cleanedJsDoc.replace(/ @notice\s*/, '* > **Notice:** ').trim();
      cleanedJsDoc = cleanedJsDoc.replace(/ @example\s*/, '* _Example_\n').trim();
      cleanedJsDoc = cleanedJsDoc.replace(/ @param\s*/, '* _Param_ ').trim();
      cleanedJsDoc = cleanedJsDoc.replace(/ @returns.+\n/, '').trim();
      cleanedJsDoc = cleanedJsDoc.replace(/ @translation\s*/, '* _See_ ').trim();
      cleanedJsDoc = cleanedJsDoc.replace(/ @throws\s*/, '* _Throws_ ').trim();
      cleanedJsDoc = cleanedJsDoc.replace(/@instance.+/, '').trim();
      cleanedJsDoc = cleanedJsDoc.replace(/@template.+/, '').trim();

      return cleanedJsDoc;
    })
    .join('\n\n');

  return cleanedJsDocContent;
}

const run = async () => {
  let readmeStart = await fs.readFile(path.join('scripts', 'readmeStart.md'), { encoding: 'utf8' });
  const translationCommonMap = await extractCommonTranslation();
  readmeStart = readmeStart.replace(/@@TRANSLATION_COMMON_MAP@@/, translationCommonMap).trim();
  let pageContext = '\n\n### Built-in Custom Assert Documentation {#builtin_custom_assert_documentation} \n';
  let textData = '\n';
  const rawDirs = await fs.readdir(path.join('src/asserts'));
  const dirs = rearrangeArray(rawDirs, ['string', 'number']);
  
  for (const dir of dirs) {
    const files = await fs.readdir(path.join('src/asserts', dir));
    const hasAsserts = files.findIndex((file) => file.endsWith('.ts') && file !== 'index.ts');
    if (hasAsserts === -1) continue;
    pageContext += `\n * [${dir}](#assertdir_${dir})`
    textData += `\n#### ${dir} {#assertdir_${dir}}`;
    // Prerequisites
    const findIndexFile = files.find((file) => file === 'index.ts');
    if (!findIndexFile) throw new Error(`Script Error, missing index file in ${dir}`);
    const indexFileData = await fs.readFile(path.join('src/asserts', dir, findIndexFile), { encoding: 'utf8' });

    textData += `
   \n <b>Prerequisites</b>
   \n\`\`\`typescript\nimport { ${dir === 'mix' ? 'oneOfTypes' : dir} } from 'bguard/${dir}';\n\`\`\`
   \n${extractJsDocContent(indexFileData)}
   `;

    for (const file of files) {
      if (file.endsWith('.ts') && file !== 'index.ts') {
        const fileData = await fs.readFile(path.join('src/asserts', dir, file), { encoding: 'utf8' });
        const fileName = path.parse(file).name;
        pageContext += `\n    * [${fileName}](#assert_${fileName}_${dir})`
        textData += `
        \n##### ${fileName} (${dir}) {#assert_${fileName}_${dir}}
        \n\`\`\`typescript\nimport { ${fileName} } from 'bguard/${dir}/${fileName}';\n\`\`\`
        \n${extractJsDocContent(fileData)}
        `;
      }
    }
  }

  textData += `\n### Contributing\nContributions are welcome! Please open an issue or submit a pull request for any bugs or feature requests.`;

  await fs.writeFile('README.md', readmeStart + pageContext + textData);
};

run();


//TODO fix context links in README
//TODO Add them on start of the page
