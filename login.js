let login = () => {
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

  if (!loginFrame._remoteObject || loginFrame._remoteObject.description.includes('auto-id')) {

    const frameList = await page.frames()

    loginFrame = frameList[frameList.length - 1]
  }
  
  // 开始填充数据进行登录
  const phone = 'xxxx'
  const pwd = 'xxxx'

  await loginFrame.waitForSelector('.j-nameforslide')
  await loginFrame.type('.j-nameforslide', phone, {delay: 50})

  await loginFrame.waitForSelector('.j-inputtext')
  await loginFrame.type('.j-inputtext', pwd, {delay: 200})
  
  const loginBtn = await loginFrame.$('#submitBtn')
  await loginBtn.click()

  await page.waitForNavigation()
  // 跳转到课程页
}

module.exports = login