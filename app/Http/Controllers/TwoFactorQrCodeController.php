<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use PragmaRX\Google2FA\Google2FA;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

class TwoFactorQrCodeController extends Controller
{
  /**
   * Get the QR code SVG for the authenticated user's two factor authentication.
   *
   * @param  \Illuminate\Http\Request  $request
   * @return \Illuminate\Http\Response
   */
  public function show(Request $request)
  {
    Log::info('Custom QR code controller accessed');

    try {
      $user = $request->user();

      // If the secret is already stored in the user record
      if ($user->two_factor_secret) {
        Log::info('User already has 2FA secret');

        // Create a new Google2FA instance
        $google2fa = new Google2FA();

        // Generate the QR code URL
        $companyName = config('app.name');
        $qrCodeUrl = $google2fa->getQRCodeUrl(
          $companyName,
          $user->email,
          decrypt($user->two_factor_secret)
        );

        // Generate SVG QR code
        $renderer = new ImageRenderer(
          new RendererStyle(200),
          new SvgImageBackEnd()
        );

        $writer = new Writer($renderer);
        $svg = $writer->writeString($qrCodeUrl);

        Log::info('QR code SVG generated manually');

        return response()->json([
          'svg' => $svg,
          'success' => true
        ]);
      } else {
        // No 2FA secret found
        Log::error('No 2FA secret found for user');
        return response()->json([
          'error' => 'Two-factor authentication is not enabled yet.',
          'success' => false
        ], 400);
      }
    } catch (\Exception $e) {
      Log::error('QR code generation failed: ' . $e->getMessage());

      return response()->json([
        'error' => 'Failed to generate QR code: ' . $e->getMessage(),
        'success' => false
      ], 500);
    }
  }
}
