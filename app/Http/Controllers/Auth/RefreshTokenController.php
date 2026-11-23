<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Tymon\JWTAuth\Exceptions\JWTException;

class RefreshTokenController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $refreshToken = $request->cookie('refresh_token');

        if (!$refreshToken) {
            return response()->json([
                'message' => 'Refresh token tidak ditemukan'
            ], 401);
        }

        try {
            $guard = Auth::guard('api');
            $newToken = $guard
                ->setToken($refreshToken)
                ->refresh();

            $ttl = 15;

            $accessCookie = cookie(
                'access_token',
                $newToken,
                $ttl,
                '/',
                null,
                $request->isSecure(),
                true,
                false,
                'lax'
            );

            $refreshCookie = cookie(
                'refresh_token',
                $newToken,
                43200,
                '/',
                null,
                $request->isSecure(),
                true,
                false,
                'lax'
            );

            return response()->json([
                'message' => 'Token berhasil diperbarui.',
            ])
                ->withCookie($accessCookie)
                ->withCookie($refreshCookie);
        } catch (JWTException $exc) {
            return response()->json([
                'message' => 'Session telah berakhir. Silahkan login kembali.'
            ], 401)
                ->withCookie(cookie()->forget('access_token'))
                ->withCookie(cookie()->forget('refresh_token'));
        }
    }
}
