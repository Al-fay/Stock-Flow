<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class JwtAuthenticate
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->cookie('access_token');
        $newToken = null;

        try {
            if ($token) {
                try {
                    $user = JWTAuth::setToken($token)->authenticate();
                } catch (JWTException $exception) {
                    $user = null;
                }
            } else {
                $user = null;
            }

            // Access token expired atau tidak tersedia.
            if (!$user) {
                $refreshToken = $request->cookie('refresh_token');

                if (!$refreshToken) {
                    return $this->logoutRedirect();
                }

                // Perbarui JWT menggunakan refresh window.
                $newToken = JWTAuth::setToken($refreshToken)->refresh();

                // Autentikasi menggunakan token yang baru.
                $user = JWTAuth::setToken($newToken)->authenticate();

                if (!$user) {
                    return $this->logoutRedirect();
                }
            }

            // Set user untuk request Laravel.
            $request->setUserResolver(fn() => $user);

            Auth::guard('api')->setUser($user);

            // Jalankan request berikutnya.
            $response = $next($request);

            // Kirim cookie baru jika token diperbarui.
            if ($newToken) {
                $response->headers->setCookie(
                    cookie(
                        'access_token',
                        $newToken,
                        15,
                        '/',
                        null,
                        $request->isSecure(),
                        true,
                        false,
                        'lax'
                    )
                );

                $response->headers->setCookie(
                    cookie(
                        'refresh_token',
                        $newToken,
                        43200,
                        '/',
                        null,
                        $request->isSecure(),
                        true,
                        false,
                        'lax'
                    )
                );
            }

            return $response;
        } catch (JWTException $exception) {
            return $this->logoutRedirect();
        }
    }

    private function logoutRedirect(): Response
    {
        return redirect()
            ->route('login')
            ->withCookie(cookie()->forget('access_token'))
            ->withCookie(cookie()->forget('refresh_token'));
    }
}
