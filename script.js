// ========== CÓDIGO DE ACESSO SIMPLES ==========

let medicoes = [];
let filtroAtual = 'todos';
let codigoAcesso = localStorage.getItem('codigoAcesso');

// Gerar código único
function gerarCodigo() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codigo = 'GLICE-';
    for (let i = 0; i < 4; i++) {
        codigo += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return codigo;
}

function criarNovoCodigo() {
    codigoAcesso = gerarCodigo();
    localStorage.setItem('codigoAcesso', codigoAcesso);
    
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.getElementById('userEmail').textContent = codigoAcesso;
    
    alert(`✅ Código criado: ${codigoAcesso}\n\nGuarde esse código para acessar de outros dispositivos!`);
    carregarDados();
}

function usarCodigoExistente() {
    const codigo = prompt('Digite seu código de acesso:');
    
    if (!codigo || codigo.trim() === '') {
        alert('❌ Código inválido!');
        return;
    }
    
    codigoAcesso = codigo.trim().toUpperCase();
    localStorage.setItem('codigoAcesso', codigoAcesso);
    
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.getElementById('userEmail').textContent = codigoAcesso;
    
    carregarDados();
}

function mostrarCodigo() {
    alert(`📱 Seu código de acesso:\n\n${codigoAcesso}\n\nUse esse código no celular para acessar seus dados!`);
}

function trocarCodigo() {
    if (confirm('⚠️ Ao trocar o código, você precisará usar o NOVO código em todos os dispositivos. Continuar?')) {
        localStorage.removeItem('codigoAcesso');
        window.location.reload();
    }
}

// Verificar código ao carregar - EXECUTAR LOGO NO INÍCIO
window.addEventListener('DOMContentLoaded', function() {
    if (codigoAcesso) {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        document.getElementById('userEmail').textContent = codigoAcesso;
        carregarDados();
    } else {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('app').style.display = 'none';
    }
});

async function carregarDados() {
    try {
        medicoes = await carregarMedicoesAPI(codigoAcesso);
        renderizarHistorico();
        atualizarEstatisticas();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        medicoes = [];
    }
}

// ========== RESTO DO APP ==========

// Nomes amigáveis para os momentos
const momentosNomes = {
    'cafe-antes': '☕ Café da Manhã - Antes',
    'cafe-depois': '☕ Café da Manhã - 1h Depois',
    'almoco-antes': '🍽️ Almoço - Antes',
    'almoco-depois': '🍽️ Almoço - 1h Depois',
    'lanche-antes': '🍰 Café da Tarde - Antes',
    'lanche-depois': '🍰 Café da Tarde - 1h Depois',
    'jantar-antes': '🌙 Jantar - Antes',
    'jantar-depois': '🌙 Jantar - 1h Depois',
    'antes-dormir': '😴 Antes de Dormir',
    'antes-treino': '💪 Antes do Treino'
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    if (!codigoAcesso) return; // Não inicializar sem código
    
    // Formulário de medição
    const form = document.getElementById('medicaoForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            salvarMedicao();
            return false;
        });
    }

    // Verificar alerta de treino
    document.getElementById('momento').addEventListener('change', function() {
        if (this.value === 'antes-treino') {
            document.getElementById('glicemia').addEventListener('input', verificarAlertaTreino);
        } else {
            document.getElementById('alertaTreino').style.display = 'none';
        }
    });
});

// Preencher data e hora atuais
function preencherDataHoraAtual() {
    const agora = new Date();
    const dataFormatada = agora.toISOString().split('T')[0];
    const horaFormatada = agora.toTimeString().split(':').slice(0, 2).join(':');
    
    document.getElementById('dataRegistro').value = dataFormatada;
    document.getElementById('horaRegistro').value = horaFormatada;
}

// Salvar medição
async function salvarMedicao() {
    // Verificar se está editando
    const editandoId = document.getElementById('medicaoForm').dataset.editandoId;
    
    // Se campos de data/hora estão ocultos, usar data/hora atual
    const camposVisiveis = document.getElementById('camposDataHora').style.display !== 'none';
    let data, hora;
    
    if (camposVisiveis && document.getElementById('dataRegistro').value) {
        data = document.getElementById('dataRegistro').value;
        hora = document.getElementById('horaRegistro').value;
    } else {
        // Usar data/hora atual
        const agora = new Date();
        data = agora.toISOString().split('T')[0];
        hora = agora.toTimeString().split(':').slice(0, 2).join(':');
    }
    
    const medicao = {
        momento: document.getElementById('momento').value,
        glicemia: parseFloat(document.getElementById('glicemia').value),
        tipoInsulina: document.getElementById('tipoInsulina').value,
        unidadesInsulina: parseFloat(document.getElementById('unidadesInsulina').value) || 0,
        anotacoes: document.getElementById('anotacoes').value || '',
        data: data,
        hora: hora,
        timestamp: new Date(`${data}T${hora}`).getTime()
    };
    
    // Se estiver editando, manter o ID
    if (editandoId) {
        medicao.id = editandoId;
    }

    try {
        const medicaoSalva = await salvarMedicaoAPI(medicao, codigoAcesso);
        
        const index = medicoes.findIndex(m => m.id === medicaoSalva.id);
        if (index >= 0) {
            medicoes[index] = medicaoSalva;
        } else {
            medicoes.unshift(medicaoSalva);
        }
        
        renderizarHistorico();
        atualizarEstatisticas();
        document.getElementById('medicaoForm').reset();
        document.getElementById('camposDataHora').style.display = 'none';
        document.getElementById('medicaoForm').dataset.editandoId = '';
        document.getElementById('btnSalvar').textContent = '💾 Registrar Medição';
        document.getElementById('btnCancelar').style.display = 'none';
        alert(editandoId ? '✅ Medição atualizada!' : '✅ Medição salva com sucesso!');
    } catch (error) {
        alert('❌ Erro ao salvar: ' + error.message);
    }
}

// Verificar alerta para treino
function verificarAlertaTreino() {
    const glicemia = parseInt(document.getElementById('glicemia').value);
    const alertaDiv = document.getElementById('alertaTreino');
    const alertaTexto = document.getElementById('alertaTexto');

    if (!glicemia || isNaN(glicemia)) {
        alertaDiv.style.display = 'none';
        return;
    }

    if (glicemia > 250) {
        alertaDiv.className = 'alert danger';
        alertaTexto.textContent = '⚠️ GLICEMIA ALTA! Tome insulina antes de treinar.';
        alertaDiv.style.display = 'block';
    } else {
        alertaDiv.className = 'alert success';
        alertaTexto.textContent = '✅ Glicemia adequada para treinar!';
        alertaDiv.style.display = 'block';
    }
}

// Renderizar histórico
function renderizarHistorico() {
    const historicoLista = document.getElementById('historicoLista');
    const medicoesFiltradas = filtrarMedicoes();

    if (medicoesFiltradas.length === 0) {
        historicoLista.innerHTML = `
            <div class="empty-state">
                <p style="font-size: 3em;">📋</p>
                <p>Nenhuma medição registrada ainda.</p>
            </div>
        `;
        return;
    }

    historicoLista.innerHTML = medicoesFiltradas.map(medicao => {
        const data = medicao.data || new Date(medicao.timestamp).toISOString().split('T')[0];
        const hora = medicao.hora || new Date(medicao.timestamp).toTimeString().split(':').slice(0, 2).join(':');
        const classeGlicemia = classificarGlicemia(medicao.glicemia);

        return `
            <div class="medicao-card">
                <div class="medicao-header">
                    <div>
                        <div class="medicao-momento">${momentosNomes[medicao.momento]}</div>
                        <div class="medicao-datetime">📅 ${new Date(data).toLocaleDateString('pt-BR')} às ${hora}</div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-edit" onclick="editarMedicao('${medicao.id}')">✏️ Editar</button>
                        <button class="btn-delete" onclick="deletarMedicao('${medicao.id}')">🗑️ Excluir</button>
                    </div>
                </div>
                <div class="medicao-body">
                    <div class="medicao-info">
                        <span class="medicao-label">Glicemia</span>
                        <span class="medicao-valor ${classeGlicemia}">${medicao.glicemia} mg/dL</span>
                    </div>
                    ${(medicao.unidadesInsulina > 0) ? `
                        <div class="medicao-info">
                            <span class="medicao-label">Insulina</span>
                            <span class="medicao-valor">
                                ${medicao.tipoInsulina || 'Não especificado'} - ${medicao.unidadesInsulina} U
                            </span>
                        </div>
                    ` : ''}
                    ${medicao.anotacoes ? `
                        <div class="medicao-info">
                            <span class="medicao-label">📝 Anotações</span>
                            <span class="medicao-valor">${medicao.anotacoes}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Classificar glicemia por cor
function classificarGlicemia(valor) {
    if (valor < 70) return 'glicemia-baixa';
    if (valor >= 70 && valor <= 140) return 'glicemia-normal';
    if (valor > 140 && valor <= 200) return 'glicemia-alta';
    return 'glicemia-muito-alta';
}

// Filtrar medições por período
function filtrarMedicoes() {
    const agora = Date.now();
    const umDia = 24 * 60 * 60 * 1000;

    switch (filtroAtual) {
        case 'hoje':
            return medicoes.filter(m => (agora - m.timestamp) < umDia);
        case 'semana':
            return medicoes.filter(m => (agora - m.timestamp) < 7 * umDia);
        case 'mes':
            return medicoes.filter(m => (agora - m.timestamp) < 30 * umDia);
        default:
            return medicoes;
    }
}

// Mudar filtro de período
function filtrarPeriodo(periodo) {
    filtroAtual = periodo;
    
    document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    renderizarHistorico();
    atualizarEstatisticas();
}

// Editar medição
function editarMedicao(id) {
    const medicao = medicoes.find(m => m.id === id);
    if (!medicao) return;

    // Rolar para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Preencher formulário
    document.getElementById('momento').value = medicao.momento;
    document.getElementById('glicemia').value = medicao.glicemia;
    document.getElementById('tipoInsulina').value = medicao.tipoInsulina || '';
    document.getElementById('unidadesInsulina').value = medicao.unidadesInsulina || '';
    document.getElementById('anotacoes').value = medicao.anotacoes || '';
    
    // Mostrar campos de data/hora e preencher
    document.getElementById('camposDataHora').style.display = 'block';
    document.getElementById('dataRegistro').value = medicao.data;
    document.getElementById('horaRegistro').value = medicao.hora;
    
    // Marcar como edição
    document.getElementById('medicaoForm').dataset.editandoId = id;
    document.getElementById('btnSalvar').textContent = '✅ Atualizar Medição';
    document.getElementById('btnCancelar').style.display = 'inline-block';
}

// Cancelar edição
function cancelarEdicao() {
    document.getElementById('medicaoForm').reset();
    document.getElementById('camposDataHora').style.display = 'none';
    document.getElementById('medicaoForm').dataset.editandoId = '';
    document.getElementById('btnSalvar').textContent = '💾 Registrar Medição';
    document.getElementById('btnCancelar').style.display = 'none';
}

// Deletar medição
async function deletarMedicao(id) {
    if (!confirm('Tem certeza que deseja excluir esta medição?')) return;
    
    try {
        await deletarMedicaoAPI(id, codigoAcesso);
        medicoes = medicoes.filter(m => m.id !== id);
        renderizarHistorico();
        atualizarEstatisticas();
        alert('✅ Medição deletada!');
    } catch (error) {
        alert('❌ Erro ao deletar: ' + error.message);
    }
}

// Atualizar estatísticas
function atualizarEstatisticas() {
    const medicoesFiltradas = filtrarMedicoes();

    if (medicoesFiltradas.length === 0) {
        document.getElementById('mediaGeral').textContent = '--';
        document.getElementById('mediaJejum').textContent = '--';
        document.getElementById('mediaPosPrandial').textContent = '--';
        document.getElementById('totalMedicoes').textContent = '0';
        return;
    }

    const somaGeral = medicoesFiltradas.reduce((acc, m) => acc + m.glicemia, 0);
    const mediaGeral = Math.round(somaGeral / medicoesFiltradas.length);
    document.getElementById('mediaGeral').textContent = `${mediaGeral} mg/dL`;

    const jejum = medicoesFiltradas.filter(m => 
        m.momento.includes('-antes') || m.momento === 'antes-dormir'
    );
    if (jejum.length > 0) {
        const mediaJejum = Math.round(jejum.reduce((acc, m) => acc + m.glicemia, 0) / jejum.length);
        document.getElementById('mediaJejum').textContent = `${mediaJejum} mg/dL`;
    } else {
        document.getElementById('mediaJejum').textContent = '--';
    }

    const posPrandial = medicoesFiltradas.filter(m => m.momento.includes('-depois'));
    if (posPrandial.length > 0) {
        const mediaPosPrandial = Math.round(posPrandial.reduce((acc, m) => acc + m.glicemia, 0) / posPrandial.length);
        document.getElementById('mediaPosPrandial').textContent = `${mediaPosPrandial} mg/dL`;
    } else {
        document.getElementById('mediaPosPrandial').textContent = '--';
    }

    document.getElementById('totalMedicoes').textContent = medicoesFiltradas.length;
}

// Exportar dados como JSON
function exportarJSON() {
    if (medicoes.length === 0) {
        alert('Não há dados para exportar.');
        return;
    }

    const dataStr = JSON.stringify(medicoes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `controle-glicemia-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    alert('📥 JSON exportado com sucesso!');
}

// Exportar PDF
function exportarPDF() {
    if (medicoes.length === 0) {
        alert('Não há dados para exportar.');
        return;
    }

    const medicoesFiltradas = filtrarMedicoes();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Controle de Glicemia', 105, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 22, { align: 'center' });

    const stats = calcularEstatisticas(medicoesFiltradas);
    doc.text(`Total: ${medicoesFiltradas.length} | Média: ${stats.mediaGeral} mg/dL`, 14, 35);

    const tableData = medicoesFiltradas.map(m => [
        new Date(m.timestamp).toLocaleDateString('pt-BR'),
        new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        momentosNomes[m.momento].replace(/[^\w\s-]/g, ''),
        `${m.glicemia} mg/dL`,
        m.unidadesInsulina > 0 ? `${m.tipoInsulina} - ${m.unidadesInsulina} U` : '-'
    ]);

    doc.autoTable({
        startY: 42,
        head: [['Data', 'Hora', 'Momento', 'Glicemia', 'Insulina']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8 }
    });

    doc.save(`controle-glicemia-${new Date().toISOString().split('T')[0]}.pdf`);
    alert('📄 PDF gerado com sucesso!');
}

// Exportar Excel
function exportarExcel() {
    if (medicoes.length === 0) {
        alert('Não há dados para exportar.');
        return;
    }

    const medicoesFiltradas = filtrarMedicoes();
    const dadosExcel = medicoesFiltradas.map(m => ({
        'Data': new Date(m.timestamp).toLocaleDateString('pt-BR'),
        'Hora': new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        'Momento': momentosNomes[m.momento],
        'Glicemia (mg/dL)': m.glicemia,
        'Tipo de Insulina': m.tipoInsulina || '',
        'Insulina (U)': m.unidadesInsulina || 0
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dadosExcel);
    XLSX.utils.book_append_sheet(wb, ws, 'Medições');
    XLSX.writeFile(wb, `controle-glicemia-${new Date().toISOString().split('T')[0]}.xlsx`);
    alert('📊 Excel gerado com sucesso!');
}

// Calcular estatísticas
function calcularEstatisticas(medicoesFiltradas) {
    if (medicoesFiltradas.length === 0) {
        return { mediaGeral: '--', mediaJejum: '--', mediaPosPrandial: '--' };
    }

    const mediaGeral = Math.round(medicoesFiltradas.reduce((acc, m) => acc + m.glicemia, 0) / medicoesFiltradas.length);

    const jejum = medicoesFiltradas.filter(m => m.momento.includes('-antes') || m.momento === 'antes-dormir');
    const mediaJejum = jejum.length > 0 
        ? Math.round(jejum.reduce((acc, m) => acc + m.glicemia, 0) / jejum.length) + ' mg/dL'
        : '--';

    const posPrandial = medicoesFiltradas.filter(m => m.momento.includes('-depois'));
    const mediaPosPrandial = posPrandial.length > 0 
        ? Math.round(posPrandial.reduce((acc, m) => acc + m.glicemia, 0) / posPrandial.length) + ' mg/dL'
        : '--';

    return { mediaGeral, mediaJejum, mediaPosPrandial };
}

// Mostrar código de acesso
function mostrarCodigo() {
    alert(`🔑 Seu código de acesso:\n\n${codigoAcesso}\n\nUse este código para acessar seus dados de outros dispositivos!`);
}

// Trocar código de acesso
function trocarCodigo() {
    if (confirm('⚠️ Deseja trocar de código?\n\nVocê perderá acesso aos dados do código atual neste dispositivo.')) {
        localStorage.removeItem('codigoAcesso');
        location.reload();
    }
}

// Sair do app
function sair() {
    if (confirm('🚪 Deseja sair?\n\nVocê pode voltar usando o mesmo código.')) {
        localStorage.removeItem('codigoAcesso');
        location.reload();
    }
}
