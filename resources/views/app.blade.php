<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <link rel="shortcut icon" href="/warehouse.svg" type="image/x-icon">

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])

    @inertiaHead
</head>

<body>
    @inertia
</body>

</html>
