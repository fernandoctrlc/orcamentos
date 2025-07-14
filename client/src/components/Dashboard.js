import React, { useEffect, useState } from 'react';

const ESTAGIOS = {
  leads: 'Leads',
  negociacao: 'Negociação',
  fila: 'Fila de Cadastro',
  cadastrado: 'Cadastrado',
  perdido: 'Perdido'
};

function Dashboard() {
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    fetch('/api/dashboard/pipeline-mensal')
      .then(res => res.json())
      .then(data => {
        setDados(data.dados || []);
        setLoading(false);
      })
      .catch(() => {
        setErro('Erro ao carregar dados do dashboard');
        setLoading(false);
      });
  }, []);

  // Agrupar por mês
  const agrupado = {};
  dados.forEach(item => {
    if (!agrupado[item.mes]) agrupado[item.mes] = {};
    agrupado[item.mes][item.estagio] = item.quantidade;
  });

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      <h2 style={{ textAlign: 'center', color: '#1976d2', marginBottom: 32 }}>Dashboard do Pipeline (por mês)</h2>
      {loading ? <div>Carregando...</div> : erro ? <div style={{color:'red'}}>{erro}</div> : (
        Object.keys(agrupado).length === 0 ? <div>Nenhum dado encontrado.</div> :
        Object.keys(agrupado).sort((a, b) => b.localeCompare(a)).map(mes => (
          <div key={mes} style={{ marginBottom: 32, background: '#f8f9fa', borderRadius: 10, boxShadow: '0 2px 8px #0001', padding: 24 }}>
            <h3 style={{ color: '#333', marginBottom: 18 }}>{mes}</h3>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              {Object.keys(ESTAGIOS).map(estagio => (
                <div key={estagio} style={{ flex: '1 1 160px', background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px #0001', padding: 18, textAlign: 'center', minWidth: 140 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#764ba2', marginBottom: 8 }}>{ESTAGIOS[estagio]}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#1976d2' }}>{agrupado[mes][estagio] || 0}</div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Dashboard; 