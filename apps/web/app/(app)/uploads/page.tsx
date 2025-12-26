'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSupabaseClient } from '@/lib/supabase/provider';

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setError('');
    setMessage('');
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsUploading(true);
    setError('');
    setMessage('');

    try {
      const csvText = await file.text();
      const { data, error } = await supabaseClient.functions.invoke('mm-import', {
        body: {
          csv: csvText,
          filename: file.name
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const uploadId = data?.uploadId;
      if (uploadId) {
        const path = `user/${(await supabaseClient.auth.getUser()).data.user?.id}/uploads/${uploadId}.csv`;
        await supabaseClient.storage.from('uploads').upload(path, file, { upsert: true });
      }

      setMessage('Upload enviado e processado. Confira o histórico.');
      setFile(null);
      await loadUploads();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao processar upload';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="uploads-page">
      <header className="uploads-header">
        <div>
          <h1>Uploads</h1>
          <p>Envie 1 CSV Miles & More por vez. O sistema processa e atualiza o histórico.</p>
        </div>
      </header>
      <div className="upload-card">
        <label className="upload-drop">
          <input type="file" accept=".csv,text/csv" onChange={handleFileChange} />
          <span>{fileLabel}</span>
        </label>
        <button type="button" onClick={handleSubmit} disabled={!file || isUploading}>
          {isUploading ? 'Processando...' : 'Enviar CSV'}
        </button>
        {error && <p className="text-error">{error}</p>}
        {message && <p className="text-success">{message}</p>}
      </div>
      <div className="uploads-table">
        <h2>Histórico</h2>
        <table>
          <thead>
            <tr>
              <th>Arquivo</th>
              <th>Status</th>
              <th>Linhas</th>
              <th>Início</th>
              <th>Fim</th>
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
                  <td>{upload.filename}</td>
                  <td>{upload.status}</td>
                  <td>
                    {upload.rows_imported}/{upload.rows_total}
                  </td>
                  <td>{new Date(upload.started_at).toLocaleString('pt-BR')}</td>
                  <td>{upload.finished_at ? new Date(upload.finished_at).toLocaleString('pt-BR') : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
