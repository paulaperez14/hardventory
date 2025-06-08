'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/AppLogo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user) {
        toast({ title: 'Inicio de Sesión Exitoso', description: `Bienvenido, ${user.name}!` });
        router.push('/dashboard');
      } else {
        toast({ title: 'Error de Inicio de Sesión', description: 'Email o Contraseña Incorrecta.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error de Inicio de Sesión', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <AppLogo className="h-12 w-auto text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Inicio de Sesión a Hardventory</CardTitle>
          <CardDescription>Introduzca sus credenciales para acceder a su cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-base"
              />
            </div>
            <Button type="submit" className="w-full text-lg py-6" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
           {/* <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Demo accounts:</p>
            <ul className="list-disc list-inside">
              <li>admin@stockpilot.com (admin)</li>
              <li>manager@stockpilot.com (bodega)</li>
              <li>seller@stockpilot.com (vendedor)</li>
            </ul>
            <p className="mt-1">Password: password</p>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
}
