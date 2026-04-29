const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src/components');

const getFiles = (dirPath, filesArray = []) => {
  if (!fs.existsSync(dirPath)) return filesArray;
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
      filesArray = getFiles(path.join(dirPath, file), filesArray);
    } else {
      filesArray.push(path.join(dirPath, file));
    }
  }
  return filesArray;
};

const files = getFiles(dir).filter(f => f.endsWith('-panel.tsx'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // 1. Replace article container
  content = content.replace(/<article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">/g, '<div className="space-y-4">');
  content = content.replace(/<\/article>/g, '</div>');

  // 2. Remove internal title headers using robust regex
  // This looks for: <div className="flex flex-wrap items-start justify-between gap-3">
  // followed by a <div> that has <p>, <h3>, <p>
  // followed by another <div className="flex flex-wrap gap-2"> or similar
  const headerRegex = /<div className="flex flex-wrap items-start justify-between gap-3">\s*<div>\s*<p className="text-xs[^>]*>.*?<\/p>\s*<h3 className="mt-1 text-lg[^>]*>.*?<\/h3>\s*<p className="text-sm[^>]*>.*?<\/p>\s*<\/div>\s*<div className="flex flex-wrap gap-2\">/gs;
  
  content = content.replace(headerRegex, '<div className="flex flex-wrap items-center justify-end gap-3">\n        <div className="flex flex-wrap gap-2">');
  
  // Also handle CompanySettingsPanel which might have a slightly different header
  // Let's just manually fix CompanySettingsPanel if needed, or see if it matches.
  
  // 3. Make tables stand out as cards
  content = content.replace(/className="mt-4 overflow-x-auto rounded-xl border border-slate-200"/g, 'className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"');
  
  // 4. Update empty states to look better without the article container
  content = content.replace(/className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center"/g, 'className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-8 text-center"');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
