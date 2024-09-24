<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

// Configurações de IMAP
$hostname = '{imap.gmail.com:993/imap/ssl}INBOX';
$username = 'email@gmail.com'; // Substitua com seu e-mail
$password = 'senha'; // Substitua com sua senha

// Conecta ao servidor IMAP
$inbox = imap_open($hostname, $username, $password) or die('Não foi possível conectar ao IMAP: ' . imap_last_error());

// Obtém os e-mails não lidos
$emails = imap_search($inbox, 'UNSEEN');

// Verifica se há e-mails não lidos
if ($emails) {
    foreach ($emails as $email_number) {
        // Obtém as informações do e-mail
        $overview = imap_fetch_overview($inbox, $email_number, 0);
        $message = imap_fetchbody($inbox, $email_number, 2);

        // Pega o remetente do e-mail
        $remetente = $overview[0]->from;

        // Extrai anexos do e-mail
        $structure = imap_fetchstructure($inbox, $email_number);

        if (isset($structure->parts) && count($structure->parts)) {
            for ($i = 0; $i < count($structure->parts); $i++) {
                $attachment = $structure->parts[$i];

                // Verifica se é um anexo
                if ($attachment->ifdparameters) {
                    foreach ($attachment->dparameters as $object) {
                        if (strtolower($object->attribute) == 'filename') {
                            // Define o caminho de salvamento
                            $filename = $object->value;
                            $filePath = 'caminho/para/pasta/' . $filename;

                            // Obtém o conteúdo do anexo
                            $attachmentContent = imap_fetchbody($inbox, $email_number, $i + 1);
                            if ($attachment->encoding == 3) { // Base64
                                $attachmentContent = base64_decode($attachmentContent);
                            } elseif ($attachment->encoding == 4) { // Quoted-printable
                                $attachmentContent = quoted_printable_decode($attachmentContent);
                            }

                            // Salva o anexo na pasta
                            file_put_contents($filePath, $attachmentContent);

                            // Envia e-mail de confirmação
                            enviarEmailConfirmacao($remetente);
                        }
                    }
                }
            }
        }
    }
}

// Fecha a conexão IMAP
imap_close($inbox);

// Função para enviar e-mail de confirmação
function enviarEmailConfirmacao($remetente)
{
    $mail = new PHPMailer(true);

    try {
        // Configurações do servidor
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'email@gmail.com'; // Substitua com seu e-mail
        $mail->Password = 'senha'; // Substitua com sua senha
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        // Destinatários
        $mail->setFrom('email@gmail.com', 'Nome');
        $mail->addAddress($remetente); // E-mail do remetente original

        // Conteúdo do e-mail
        $mail->isHTML(true);
        $mail->Subject = 'Confirmação de recebimento de anexo';
        $mail->Body = 'O anexo foi processado com sucesso e salvo.';

        // Envia o e-mail
        $mail->send();
        echo 'E-mail de confirmação enviado.';
    } catch (Exception $e) {
        echo "Erro ao enviar o e-mail: {$mail->ErrorInfo}";
    }
}

?>
