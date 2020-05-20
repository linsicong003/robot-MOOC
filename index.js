const fs = require('fs')
const puppeteer = require('puppeteer');

(async () => {
  const browser = await (puppeteer.launch({
    // 若是手动下载的chromium需要指定chromium地址, 默认引用地址为 /项目目录/node_modules/puppeteer/.local-chromium/
    // executablePath: '/Users/huqiyang/Documents/project/z/chromium/Chromium.app/Contents/MacOS/Chromium',
    //设置超时时间
    timeout: 15000,
    //如果是访问https页面 此属性会忽略https错误
    ignoreHTTPSErrors: true,
    // 打开开发者工具, 当此值为true时, headless总为false
    devtools: false,
    // 关闭headless模式, 不会打开浏览器
    headless: false
  }));
  const page = await browser.newPage();
  console.log('开始爬取');
  
  await page.goto('https://www.icourse163.org/learn/scnu-1207440802#/learn/forumdetail?pid=1309584543');
//   await page.screenshot({
//     path: 'jianshu.png',
//     type: 'png',
//     // quality: 100, 只对jpg有效
//     fullPage: true,
//     // 指定区域截图，clip和fullPage两者只能设置一个
//     // clip: {
//     //   x: 0,
//     //   y: 0,
//     //   width: 1000,
//     //   height: 40
//     // }
//   });
console.log('开始写入');
let detail = await page.$('.m-detailInfoItem')

fs.writeFileSync('test.txt', detail, {flag: 'a'}, err => {
    if (err) {
        console.log('错误：', err);
    } else {
        console.log('写入成功');
        
    }
})
console.log('完成写入');
  
  browser.close();
})();