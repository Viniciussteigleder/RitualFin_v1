'use client';

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useSupabaseClient, useSession } from '@/lib/supabase/provider';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Table, TableContainer } from '@/components/ui/Table';

type UploadRecord = {
  id: string;
  filename: string;
  status: string;
  rows_total: number;
  rows_imported: number;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
};

export default function UploadsPage() {
  const supabaseClient = useSupabaseClient();
  const session = useSession();
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fileLabel = useMemo(() => {
    if (!file) return 'Selecione um CSV Miles & More';
    return `${file.name} (${Math.round(file.size / 1024)} KB)`;
  }, [file]);

  const loadUploads = useCallback(async () => {
    const { data, error } = await supabaseClient
      .from('uploads')
      .select('*')
      .order('started_at', { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }

    setUploads((data ?? []) as UploadRecord[]);
  }, [supabaseClient]);

  useEffect(() => {
    loadUploads();
  }, [loadUploads]);

  const handleSubmit = async (selectedFile?: File | null) => {
    const fileToUpload = selectedFile ?? file;
    if (!fileToUpload || isUploading) return;

    // Check authentication
    if (!session) {
      setError('Você precisa estar autenticado para fazer upload.');
      return;
    }

    setIsUploading(true);
    setError('');
    setMessage('');
    setFile(fileToUpload);

    try {
      const csvText = await fileToUpload.text();
      console.log('[Upload] Starting upload for:', fileToUpload.name);
      console.log('[Upload] User:', session.user.email);
      console.log('[Upload] File size:', Math.round(fileToUpload.size / 1024), 'KB');

      // Get fresh session token
      const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();

      if (sessionError || !sessionData.session) {
        console.error('[Upload] Session error:', sessionError);
        throw new Error('Sessão inválida. Faça login novamente.');
      }

      const accessToken = sessionData.session.access_token;
      console.log('[Upload] Has access token:', !!accessToken);
      console.log('[Upload] Token preview:', accessToken.substring(0, 20) + '...');

      // Use Next.js API route instead of Supabase Edge Function
      const apiUrl = '/api/mm-import';
      console.log('[Upload] API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          csv: csvText,
          filename: fileToUpload.name
        })
      });

      console.log('[Upload] Response status:', response.status);
      console.log('[Upload] Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('[Upload] Response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('[Upload] Failed to parse response as JSON:', e);
        throw new Error(`Resposta inválida do servidor: ${responseText.substring(0, 100)}`);
      }

      if (!response.ok) {
        console.error('[Upload] Function error:', data);
        throw new Error(data.error || data.message || `Erro ${response.status}`);
      }

      console.log('[Upload] Success:', data);
      setMessage('Upload enviado e processado. Confira o histórico.');
      setFile(null);
      await loadUploads();
    } catch (err) {
      console.error('[Upload] Catch error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido ao processar upload';
      setError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setError('');
    setMessage('');
    if (selected) {
      void handleSubmit(selected);
    } else {
      setFile(null);
    }
  };

  return (
    <section className="uploads-page">
      <header className="uploads-header">
        <div>
          <h1>Upload de CSV | Miles & More</h1>
          <p className="muted">Gerencie seus extratos e importe novas transações para o orçamento mensal.</p>
        </div>
      </header>
      <Card className="rf-card-default">
        <label className="upload-dropzone">
          <input type="file" accept=".csv,text/csv" onChange={handleFileChange} />
          <div className="rf-logo">⬆</div>
          <strong>Arraste seu arquivo CSV aqui</strong>
          <span className="muted">Ou clique para selecionar do seu computador.</span>
          <Button variant="secondary" disabled={!file}>
            {file ? fileLabel : 'Selecionar Arquivo'}
          </Button>
          <span className="muted">Suporta apenas arquivos CSV do Miles & More. Limite de 10MB.</span>
        </label>
        <Button onClick={() => handleSubmit()} disabled={!file || isUploading}>
          {isUploading ? 'Processando...' : 'Enviar CSV'}
        </Button>
        {error && <p className="text-error">{error}</p>}
        {message && <p className="text-success">{message}</p>}
      </Card>
      <Card className="rf-card-default">
        <div className="uploads-header">
          <h2>Histórico de Importações</h2>
          <Button variant="ghost">Filtrar</Button>
        </div>
        <TableContainer>
          <Table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Arquivo</th>
                <th>Data do upload</th>
                <th>Mês ref.</th>
                <th>Linhas</th>
              </tr>
            </thead>
            <tbody>
              {uploads.length === 0 ? (
                <tr>
                  <td colSpan={5}>Nenhum upload ainda.</td>
                </tr>
              ) : (
                uploads.map((upload) => (
                  <tr key={upload.id}>
                    <td>
                      <Badge
                        tone={
                          upload.status === 'ready'
                            ? 'success'
                            : upload.status === 'processing'
                            ? 'info'
                            : upload.status === 'error'
                            ? 'error'
                            : 'warning'
                        }
                      >
                        {upload.status === 'ready'
                          ? 'Pronto'
                          : upload.status === 'processing'
                          ? 'Processando'
                          : upload.status === 'error'
                          ? 'Erro'
                          : 'Duplicado'}
                      </Badge>
                    </td>
                    <td>{upload.filename}</td>
                    <td>{new Date(upload.started_at).toLocaleString('pt-BR')}</td>
                    <td>{upload.finished_at ? new Date(upload.finished_at).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>
                      {upload.rows_imported}/{upload.rows_total}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </TableContainer>
      </Card>
    </section>
  );
}
