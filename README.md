# Email-Attachment-Processor
Este projeto tem como objetivo automatizar o processo de verificar e-mails, baixar anexos do tipo CSV e enviar uma confirmação para o remetente de que o anexo foi recebido e salvo com sucesso.

Funcionalidades
Conecta-se a uma conta de e-mail via protocolo IMAP.
Verifica novos e-mails não lidos (UNSEEN).
Baixa e salva anexos do tipo text/csv em uma pasta local.
Envia uma confirmação por e-mail ao remetente após o salvamento bem-sucedido do anexo.
Executa automaticamente a cada 5 minutos usando node-cron.
Dependências
Este projeto usa as seguintes bibliotecas Node.js:

imap: para conectar e acessar e-mails via protocolo IMAP.
mailparser: para interpretar o conteúdo dos e-mails e extrair anexos.
nodemailer: para enviar e-mails de confirmação.
fs e path: para manipular o sistema de arquivos e salvar anexos localmente.
node-cron: para agendar a verificação automática de e-mails em intervalos regulares.

Instalação de Dependências
Instale todas as dependências com o seguinte comando:

npm install imap mailparser nodemailer node-cron


Configuração
1. Configuração IMAP
No código, as configurações de login e servidor IMAP devem ser configuradas corretamente para sua conta de e-mail:

const imapConfig = {
  user: 'email@gmail.com',
  password: 'senha',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
};

Altere os campos user e password para seu próprio e-mail e senha de app. Caso utilize outro servidor de e-mail que não o Gmail, ajuste os parâmetros host e port adequadamente.

Importante: Nunca armazene senhas diretamente no código em produção. Considere usar variáveis de ambiente ou um serviço de gerenciamento de segredos.

2. Configuração de E-mail de Confirmação
O envio do e-mail de confirmação é realizado através do nodemailer com um transporte configurado para o serviço de e-mail. Aqui está a configuração:

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'email@gmail.com',
    pass: 'senha',
  },
});

Novamente, substitua user e pass pelos detalhes da sua conta de e-mail. A senha de app deve ser gerada dentro das configurações da sua conta do Gmail.

3. Estrutura de Pastas
Os anexos são salvos em uma pasta chamada attachments localizada no mesmo diretório do script. O código cria essa pasta automaticamente caso ela não exista:

const attachmentsFolder = path.join(__dirname, 'attachments');


Execução
O script é executado automaticamente a cada 5 minutos, verificando por novos e-mails e processando qualquer anexo CSV encontrado.

Execução Manual
Para rodar o processo manualmente, basta executar o script diretamente:

node app.js

Execução Automática (Agendada)
Usamos a biblioteca node-cron para agendar a execução do processo de verificação de e-mails a cada 5 minutos. O cron job é configurado da seguinte forma:

cron.schedule('*/5 * * * *', () => {
  console.log('Executando o job de verificação de e-mails...');
  processEmails();
});

Funções Principais
1. processEmails
Esta função é responsável por conectar-se ao servidor IMAP, buscar por e-mails não lidos, verificar se possuem anexos CSV e chamar a função para salvar esses anexos.

2. downloadAttachment
Baixa e salva os anexos do tipo text/csv na pasta local attachments.

3. sendConfirmationEmail
Envia um e-mail de confirmação ao remetente, informando que o anexo foi salvo com sucesso.

4. Cron Job
Agendamento automático da verificação de e-mails, configurado para rodar a cada 5 minutos:

cron.schedule('*/5 * * * *', () => {
  processEmails();
});

Exemplo de Execução
Aqui está um exemplo de execução do script:

$ node app.js
Executando o job de verificação de e-mails...
E-mails não lidos encontrados: 2
Assunto do e-mail: Relatório de vendas
Anexos encontrados: 1
Baixando anexo: relatorio-vendas.csv
Salvando anexo em: /caminho/do/projeto/attachments/relatorio-vendas.csv
Anexo salvo com sucesso: /caminho/do/projeto/attachments/relatorio-vendas.csv
E-mail de confirmação enviado: 250 OK
Fim do processamento de e-mails.
Conexão IMAP encerrada.

