import Mailer from 'react-native-mail'

export default ({
  subject,
  body,
  isHTML,
  recipients,
}: {
  subject: string
  body: string
  isHTML: boolean
  recipients?: string[]
}) =>
  Mailer.mail(
    {
      subject,
      body,
      isHTML,
      recipients,
    },
    // eslint-disable-next-line no-console
    (error, event) => console.log({ error, event }),
  )
