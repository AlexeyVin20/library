const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

// Директории для обработки (относительно корня проекта)
const directories = [
  'app',
  'components',
  'once-ui',
];

// Расширения файлов для обработки
const extensions = ['.tsx', '.jsx'];

// Функция для рекурсивного поиска файлов
function findFiles(dir, extensions, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next') {
      findFiles(fullPath, extensions, files);
    } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Функция для обновления компонентов Link
function updateLinksInFile(filePath) {
  try {
    // Чтение файла
    const code = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    
    // Парсинг кода
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
    
    // Обход AST
    traverse(ast, {
      JSXElement(path) {
        if (path.node.openingElement.name.name === 'Link' && 
            path.node.openingElement.attributes.some(attr => 
              attr.name && attr.name.name === 'legacyBehavior')) {
          
          // Нашли компонент Link с legacyBehavior
          modified = true;
          
          // Удаляем атрибуты legacyBehavior и passHref
          path.node.openingElement.attributes = path.node.openingElement.attributes.filter(attr => 
            !(attr.name && (attr.name.name === 'legacyBehavior' || attr.name.name === 'passHref'))
          );
          
          // Если у Link есть только один дочерний элемент и это JSXElement
          if (path.node.children.length === 1 && t.isJSXElement(path.node.children[0])) {
            const childElement = path.node.children[0];
            
            // Переносим атрибуты из дочернего элемента в Link
            childElement.openingElement.attributes.forEach(attr => {
              // Не переносим ключи и некоторые специфические атрибуты
              if (attr.name && attr.name.name !== 'key') {
                path.node.openingElement.attributes.push(attr);
              }
            });
            
            // Заменяем дочерний элемент на его детей
            path.node.children = childElement.children;
          }
        }
      }
    });
    
    // Если были изменения, сохраняем файл
    if (modified) {
      const output = generate(ast, {}, code);
      fs.writeFileSync(filePath, output.code, 'utf-8');
      console.log(`Обновлен файл: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Ошибка при обработке файла ${filePath}:`, error);
    return false;
  }
}

// Основная функция
function main() {
  // Собираем файлы для обработки
  let files = [];
  for (const dir of directories) {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      files = [...files, ...findFiles(dirPath, extensions)];
    }
  }
  
  console.log(`Найдено ${files.length} файлов для обработки.`);
  
  // Обрабатываем каждый файл
  let updatedCount = 0;
  for (const file of files) {
    if (updateLinksInFile(file)) {
      updatedCount++;
    }
  }
  
  console.log(`Обновлено ${updatedCount} файлов.`);
}

main(); 