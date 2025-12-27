'use client';

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useSupabaseClient } from '@/lib/supabase/provider';
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

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
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
        <Button onClick={handleSubmit} disabled={!file || isUploading}>
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
