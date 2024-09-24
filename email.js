const Imap = require('imap');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

// Configurações do IMAP
const imapConfig = {
  user: 'email@gmail.com',
  password: 'senha',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }, // Desabilitar verificação de certificado
};

// Função para baixar anexos
function downloadAttachment(attachment) {
  const attachmentsFolder = path.join(__dirname, 'attachments');

  // Verificar se a pasta de anexos existe, caso contrário, criá-la
  if (!fs.existsSync(attachmentsFolder)) {
    console.log('Criando a pasta "attachments"...');
    fs.mkdirSync(attachmentsFolder);
  }

  const outputPath = path.join(attachmentsFolder, attachment.filename);

  // Log para verificar o nome do arquivo e o caminho
  console.log(`Salvando anexo em: ${outputPath}`);

  // Escrever o arquivo diretamente a partir do buffer de conteúdo
  fs.writeFile(outputPath, attachment.content, (err) => {
    if (err) {
      console.error(`Erro ao salvar o anexo: ${err}`);
    } else {
      console.log(`Anexo salvo com sucesso: ${outputPath}`);
      sendConfirmationEmail(attachment); // Envia e-mail de confirmação
    }
  });
}

// Função para processar e-mails
function processEmails() {
  const imap = new Imap(imapConfig);

  imap.once('ready', () => {
    imap.openBox('INBOX', true, (err, box) => {
      if (err) throw err;

      // Verificar se existem e-mails não lidos
      imap.search(['UNSEEN'], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
          console.log(`E-mails não lidos encontrados: ${results.length}`);
          
          const f = imap.fetch(results, { bodies: '', struct: true });
          f.on('message', (msg, seqno) => {
            msg.on('body', (stream, info) => {
              simpleParser(stream, (err, parsed) => {
                if (err) throw err;

                console.log(`Assunto do e-mail: ${parsed.subject}`);

                // Verificar se há anexos
                if (parsed.attachments.length > 0) {
                  console.log(`Anexos encontrados: ${parsed.attachments.length}`);
                  
                  parsed.attachments.forEach(attachment => {
                    // Verifica se o anexo é um CSV
                    if (attachment.contentType === 'text/csv') {
                      console.log(`Baixando anexo: ${attachment.filename}`);
                      downloadAttachment(attachment);
                    } else {
                      console.log(`Ignorando anexo: ${attachment.filename} (Tipo: ${attachment.contentType})`);
                    }
                  });
                } else {
                  console.log('Nenhum anexo encontrado neste e-mail.');
                }
              });
            });
          });

          f.once('end', () => {
            console.log('Fim do processamento de e-mails.');
            imap.end();
          });
        } else {
          console.log('Nenhum novo e-mail encontrado.');
          imap.end();
        }
      });
    });
  });

  imap.once('error', err => {
    console.error(`Erro de conexão IMAP: ${err}`);
  });

  imap.once('end', () => {
    console.log('Conexão IMAP encerrada.');
  });

  imap.connect();
}

// Agendar a execução do processo a cada 5 minutos
cron.schedule('*/5 * * * *', () => {
  console.log('Executando o job de verificação de e-mails...');
  processEmails();
});

// Função para enviar e-mail de confirmação
function sendConfirmationEmail(attachment) {
  // Configuração do transporte de e-mail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'email@gmail.com',
      pass: 'senha',
    },
  });

  // Verificar se o campo 'from' contém um e-mail válido
  const fromEmail = attachment.headers && attachment.headers.get('from') 
    ? attachment.headers.get('from').value[0].address
    : 'email@gmail.com'; // Se não houver remetente, usar seu próprio e-mail

  // Configuração do e-mail
  const mailOptions = {
    from: 'email@gmail.com',
    to: fromEmail, // Para o remetente do e-mail
    subject: 'Confirmação de Anexo Recebido',
    text: `O anexo ${attachment.filename} foi recebido e salvo com sucesso!`,
  };

  // Enviar o e-mail
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(`Erro ao enviar e-mail: ${error}`);
    } else {
      console.log(`E-mail de confirmação enviado: ${info.response}`);
    }
  });
}
