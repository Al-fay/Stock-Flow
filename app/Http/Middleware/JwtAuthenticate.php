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

        if (! $token) {
            return redirect()->route('login');
        }

        try {
            $user = JWTAuth::setToken($token)->authenticate();

            if (! $user) {
                return redirect()
                    ->route('login')
                    ->withCookie(cookie()->forget('access_token'));
            }

            // Jadikan user JWT sebagai user pada request ini.
            $request->setUserResolver(fn() => $user);

            Auth::guard('api')->setUser($user);
        } catch (JWTException $exception) {
            return redirect()
                ->route('login')
                ->withCookie(cookie()->forget('access_token'));
        }

        return $next($request);
    }
}
