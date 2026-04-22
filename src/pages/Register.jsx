import React, { useState } from 'react';
import { auth } from '@/api/firebaseClient';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { entities } from '@/api/firebase-entities';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate, Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: fullName });
      await entities.Tenant.create({
        full_name: fullName,
        family_name: familyName,
        phone,
        email,
        status: 'pendiente',
      });
      setDone(true);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Ese email ya está registrado.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('Ocurrió un error. Intentá de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-sm p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-xl font-bold mb-2">¡Registro exitoso!</h2>
          <p className="text-gray-500 text-sm mb-4">
            Tu cuenta fue creada. El administrador va a revisar tus datos y asignarte tu casa. Te avisará cuando esté listo.
          </p>
          <button
            style={{ backgroundColor: '#2563eb', color: 'white', width: '100%', padding: '10px', borderRadius: '8px', fontWeight: '500' }}
            onClick={() => navigate('/')}
          >
            Ir al inicio
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-3">
            <Building2 className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">La Vecindad</h1>
          <p className="text-gray-500 text-sm mt-1">Crear tu cuenta de inquilino</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Nombre completo</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Juan García" required />
          </div>
          <div>
            <Label>Nombre de familia</Label>
            <Input value={familyName} onChange={e => setFamilyName(e.target.value)} placeholder="García" required />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="11 1234-5678" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required />
          </div>
          <div>
            <Label>Contraseña</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" required />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            style={{ backgroundColor: '#2563eb', color: 'white', width: '100%', padding: '10px', borderRadius: '8px', fontWeight: '500', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Creando cuenta...' : 'Registrarme'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-blue-600 font-medium">Ingresá acá</Link>
        </p>
      </Card>
    </div>
  );
}