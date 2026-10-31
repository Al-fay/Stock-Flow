<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class AuthenticatedSessionController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $credentials['email'] = strtolower(trim($credentials['email']));

        try {
            $token = Auth::guard('api')->attempt($credentials);
        } catch (JWTException $exception) {
            throw ValidationException::withMessages([
                'email' => 'Terjadi kesalahan saat login. Silakan coba lagi.',
            ]);
        }

        if (! $token) {
            throw ValidationException::withMessages([
                'email' => 'Email atau password yang kamu masukkan salah.',
            ]);
        }

        $cookie = cookie(
            'access_token',
            $token,
            (int) config('jwt.ttl', 15),
            '/',
            null,
            $request->isSecure(),
            true,
            false,
            'lax'
        );

        return redirect()
            ->intended(route('dashboard'))
            ->withCookie($cookie);
    }

    public function destroy(Request $request): RedirectResponse
    {
        $token = $request->cookie('access_token');

        if ($token) {
            try {
                JWTAuth::setToken($token)->invalidate();
            } catch (JWTException $exception) {
                // Tetap hapus cookie meskipun token sudah tidak valid.
            }
        }

        return redirect()
            ->route('login')
            ->withCookie(cookie()->forget('access_token'))
            ->with('success', 'Kamu berhasil logout.');
    }
}
