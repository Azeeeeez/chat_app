import {Resend} from 'resend'
import '.././config'
import { resetPasswordBody } from '../types/index';


const resend = new Resend(process.env.RESEND_API_KEY);

 export async function sendEmail({to, subject, html}: resetPasswordBody) {
  console.log(process.env.SMTP_HOST)
  const { data, error } = await resend.emails.send({
    from: 'onboarding@resend.dev', // use verifed domain for production
    to: to,
    subject: subject,
    html: html,
  });

  if (error) {
    console.error('Failed to send:', error);
    return;
  }

  console.log('Sent:', data);
}


export async function welcomeEmail(to: string) : Promise<void> {
  const {data, error} = await resend.emails.send({
    from: 'onboarding.resend.dev',
    to: to,
    subject: "Account signup Successful🎉",
    html: `Dear user, You have successfully signed up with your email ${to}`
  });

   if (error) {
    console.error('Failed to send:', error);
    return;
  }

  console.log('Sent:', data);
}


// i live among the creatures of the night