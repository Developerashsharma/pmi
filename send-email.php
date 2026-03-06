<?php
// Prevent direct access
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('HTTP/1.1 403 Forbidden');
    exit('Direct access not allowed');
}

// Configuration
$to_email = "ashish.v.frugolnova@gmail.com";
$from_email = "noreply@paramountmetal.com"; // Change this to your domain email

// Security: Basic spam protection
$honeypot = isset($_POST['website']) ? $_POST['website'] : '';
if (!empty($honeypot)) {
    // Likely a bot
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Thank you for your message!']);
    exit;
}

// Get and sanitize form data
function sanitize_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// Collect form data
$name = isset($_POST['name']) ? sanitize_input($_POST['name']) : '';
$email = isset($_POST['email']) ? sanitize_input($_POST['email']) : '';
$phone = isset($_POST['phone']) ? sanitize_input($_POST['phone']) : '';
$subject = isset($_POST['subject']) ? sanitize_input($_POST['subject']) : 'Contact Form Submission';
$message = isset($_POST['message']) ? sanitize_input($_POST['message']) : '';
$service = isset($_POST['service']) ? sanitize_input($_POST['service']) : '';
$company = isset($_POST['company']) ? sanitize_input($_POST['company']) : '';

// Validation
$errors = [];

if (empty($name)) {
    $errors[] = 'Name is required';
}

if (empty($email)) {
    $errors[] = 'Email is required';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Invalid email format';
}

if (empty($message)) {
    $errors[] = 'Message is required';
}

// If there are errors, return them
if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => implode(', ', $errors)]);
    exit;
}

// Build email content
$email_subject = "Contact Form: " . $subject;

$email_body = "You have received a new message from the contact form on Paramount Metal Industries website.\n\n";
$email_body .= "Contact Details:\n";
$email_body .= "================\n";
$email_body .= "Name: " . $name . "\n";
$email_body .= "Email: " . $email . "\n";

if (!empty($phone)) {
    $email_body .= "Phone: " . $phone . "\n";
}

if (!empty($company)) {
    $email_body .= "Company: " . $company . "\n";
}

if (!empty($service)) {
    $email_body .= "Service Interested In: " . $service . "\n";
}

$email_body .= "\nMessage:\n";
$email_body .= "================\n";
$email_body .= $message . "\n\n";
$email_body .= "================\n";
$email_body .= "Sent from: " . $_SERVER['HTTP_HOST'] . "\n";
$email_body .= "IP Address: " . $_SERVER['REMOTE_ADDR'] . "\n";
$email_body .= "Date/Time: " . date('Y-m-d H:i:s') . "\n";

// Email headers
$headers = "From: " . $from_email . "\r\n";
$headers .= "Reply-To: " . $email . "\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Send email
$mail_sent = mail($to_email, $email_subject, $email_body, $headers);

// Return response
header('Content-Type: application/json');

if ($mail_sent) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Thank you for your message! We will get back to you soon.'
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Sorry, there was an error sending your message. Please try again later or contact us directly.'
    ]);
}
?>
