<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = htmlspecialchars($_POST['name']);
    $email = htmlspecialchars($_POST['email']);
    $reason = htmlspecialchars($_POST['reason']);
    $message = htmlspecialchars($_POST['message']);

    $to = "mahendrapurbia19@gmail.com";
    $subject = "New Contact Form Submission: $reason";
    $body = "Name: $name\nEmail: $email\nReason for Contact: $reason\n\nMessage:\n$message";
    $headers = "From: $email";

    if (mail($to, $subject, $body, $headers)) {
        echo "Message sent successfully!";
    } else {
        echo "Failed to send message.";
    }
} else {
    echo "Invalid request.";
}
?>
