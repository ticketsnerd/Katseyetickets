<?php
require 'vendor/autoload.php'; // Ensure this points to your composer vendor folder

use Square\SquareClient;
use Square\Environment;
use Square\Models\Money;
use Square\Models\CreatePaymentRequest;

// ---------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------
// In production, use Environment::PRODUCTION and your real access token.
// KEEP THIS KEY SAFE. Do not commit it to public repos.
$accessToken = 'sq0idp-brXOtCaOhiSpu6ZwJF7a-Q'; 
$locationId  = 'LG23ERAFG60C2';
$environment = Environment::PRODUCTION; // Change to Environment::PRODUCTION for live
// ---------------------------------------------------------

// Setup Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle Preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get JSON input
$data = json_decode(file_get_contents("php://input"));

if (empty($data->token) || empty($data->amount)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing token or amount']);
    exit();
}

// Initialize Square Client
$client = new SquareClient([
    'accessToken' => $accessToken,
    'environment' => $environment,
]);

try {
    $paymentsApi = $client->getPaymentsApi();

    // Square requires the amount in CENTS (integers). 
    // e.g., $10.00 becomes 1000.
    // We multiply by 100 and cast to integer.
    $amountMoney = new Money();
    $amountMoney->setAmount((int)($data->amount * 100)); 
    $amountMoney->setCurrency("USD");

    // Create Request
    $createPaymentRequest = new CreatePaymentRequest(
        $data->token, // The token received from React
        uniqid(),     // Idempotency key (unique ID for this transaction)
        $amountMoney
    );
    
    $createPaymentRequest->setLocationId($locationId); // Optional but recommended

    // Execute Payment
    $response = $paymentsApi->createPayment($createPaymentRequest);

    if ($response->isSuccess()) {
        echo json_encode([
            'status' => 'success', 
            'payment' => $response->getResult()->getPayment()
        ]);
    } else {
        $errors = $response->getErrors();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'errors' => $errors]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
