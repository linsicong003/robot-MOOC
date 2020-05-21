const fs = require('fs')
const puppeteer = require('puppeteer');

(async () => {
  // 创建一个浏览器实例
  const browser = await (puppeteer.launch({
    // 若是手动下载的chromium需要指定chromium地址, 默认引用地址为 /项目目录/node_modules/puppeteer/.local-chromium/
    // executablePath: '/Users/huqiyang/Documents/project/z/chromium/Chromium.app/Contents/MacOS/Chromium',
    //设置超时时间
    timeout: 50000,
    //如果是访问https页面 此属性会忽略https错误
    ignoreHTTPSErrors: true,
    // 打开开发者工具, 当此值为true时, headless总为false
    devtools: false,
    // 关闭headless模式, 不会打开浏览器
    headless: false
  }));

  // 新开一个页面实例
  const page = await browser.newPage();
  console.log('开始爬取');

  // 首页执行登录
  // await page.goto('https://www.icourse163.org/', {
  //   waitUntil: 'networkidle2'  // 网络空闲说明已加载完毕
  // });
  await page.goto('https://www.icourse163.org/', {
  });

  // 点击登录按钮模拟登录
  const clickLoginButtion = await page.$('.m-index-person-loginBtn')
  
  clickLoginButtion.click()

  await page.waitForSelector('.ux-tabs-underline_hd>.last-login-holder')

  // 选中手机登录，这里有三个选项 0 邮箱登录 1 手机登录 2 爱课程登录 

  const clickPhoneWayLogin = await page.$$('.ux-tabs-underline_hd>.last-login-holder')
  
  clickPhoneWayLogin[1].click()
  console.log('开始登录')

  // 获取登录模块的 iframe
  const frameList = await page.frames()
  let loginFrame = frameList[frameList.length - 1]
  // console.log(frameList);
  // frameList.forEach((item, index) => {
  //   console.log(item.name());
  //   console.log(item.src);
    
  //   if (item._url.includes('https://reg.icourse163.org/webzj')) loginFrame = item
  // })
  // console.log(loginFrame, 'login');

  
  await loginFrame.waitForSelector('.j-nameforslide')
  // console.log(await page.$('.j-nameforslide'))
  // let a = await page.$('.j-nameforslide')
  // console.log(a);
 

  // // 开始填充数据
  const phone = '18928301126'
  const pwd = 'lin8833999'
  await loginFrame.type('.j-nameforslide', phone, {delay: 50})
  await loginFrame.waitForSelector('.j-inputtext')
  await loginFrame.type('.j-inputtext', pwd, {delay: 200})

})();

// (async () => {
//   const browser = await puppeteer.launch({
//       headless: true,
//       timeout: 50000
//   })

//   const page = await browser.newPage()

//   // 去豆瓣那个页面
//   await page.goto('https://accounts.douban.com/passport/login', {
//       waitUntil: 'networkidle2'  // 网络空闲说明已加载完毕
//   });

//   // 点击搜索框拟人输入
//   const clickPhoneLogin = await page.$('.account-tab-account')

//   await clickPhoneLogin.click()

//   const name = 'xxxxxxxxxx'
//   await page.type('input[id="username"]', name, {delay: 0})

//   const pwd = 'xxxxxxxxxx'
//   await page.type('input[id="password"]', pwd, {delay: 1})

//   // 获取登录按钮元素
//   const loginElement = await page.$('div.account-form-field-submit > a')

//   await loginElement.click()

//   await page.waitForNavigation()

//   await browser.close()
// })();
