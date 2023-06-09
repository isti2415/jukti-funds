const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  const { userEmail, userPassword, defaultersList, mailSubject, mailer } = req.body;

  try {
    // Create the transporter using the provided email credentials
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: userEmail,
        pass: userPassword,
      },
    });

    // Send emails to defaulters
    for (const defaulter of defaultersList) {
      const { name, email, mailBody } = defaulter;

      const mailOptions = {
        from: `${mailer} <${userEmail}>`,
        to: email,
        subject: mailSubject,
        text: mailBody,
      };

      await transporter.sendMail(mailOptions);
    }

    res.status(200).json({ message: 'Emails sent successfully' });
  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({ message: 'Error sending emails. Please try again later.' });
  }
}
