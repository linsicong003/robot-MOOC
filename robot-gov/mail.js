const nodemailer = require('nodemailer');
const mailList = ['linsicong003@163.com']
// const mailList = ['linsicong003@163.com', '254026695@qq.com']


module.exports = (text, subject) => {
    if (!text) {
        text = '<b>Hello world?</b>'
    }

    let transporter = nodemailer.createTransport({
        // host: 'smtp.ethereal.email',
        service: '163', // 使用了内置传输发送邮件 查看支持列表：https://nodemailer.com/smtp/well-known/
        port: 465, // SMTP 端口
        secureConnection: true, // 使用了 SSL
        auth: {
            user: 'clancy_lin@163.com',
            // 这里密码不是qq密码，是你设置的smtp授权码
            pass: 'DTJLLXDQTWCTYSMI',
        }
    });
        
    let mailOptions = {
        from:  '"ClancyLin" <clancy_lin@163.com>', // sender address
        // to: 'linsicong003@163.com', // list of receivers
        subject: subject, // Subject line
        // 发送text或者html格式
        // text: 'Hello world?', // plain text body
        html: text // html body
    };
        
    // send mail with defined transport object
    mailList.forEach(item => {
        mailOptions.to = item
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
            // Message sent: <04ec7731-cc68-1ef6-303c-61b0f796b78f@qq.com>
        });
    })
}


