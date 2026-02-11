// Carregar dados do localStorage
let medicoes = JSON.parse(localStorage.getItem('medicoes')) || [];
let filtroAtual = 'todos';

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
    renderizarHistorico();
    atualizarEstatisticas();

    // Formulário de medição
    document.getElementById('medicaoForm').addEventListener('submit', function(e) {
        e.preventDefault();
        adicionarMedicao();
    });

    // Verificar alerta de treino ao mudar o momento
    document.getElementById('momento').addEventListener('change', function() {
        if (this.value === 'antes-treino') {
            document.getElementById('glicemia').addEventListener('input', verificarAlertaTreino);
        } else {
            document.getElementById('alertaTreino').style.display = 'none';
            document.getElementById('glicemia').removeEventListener('input', verificarAlertaTreino);
        }
    });
});

// Adicionar nova medição
function adicionarMedicao() {
    const momento = document.getElementById('momento').value;
    const glicemia = parseInt(document.getElementById('glicemia').value);
    const tipoInsulina = document.getElementById('tipoInsulina').value;
    const unidadesInsulina = parseFloat(document.getElementById('unidadesInsulina').value) || 0;
    const anotacoes = document.getElementById('anotacoes').value.trim();

    // Criar objeto da medição com data/hora atual
    const medicao = {
        id: Date.now(),
        momento: momento,
        glicemia: glicemia,
        tipoInsulina: tipoInsulina,
        unidadesInsulina: unidadesInsulina,
        anotacoes: anotacoes,
        dataHora: new Date().toISOString()
    };

    // Adicionar ao array e salvar
    medicoes.unshift(medicao); // Adiciona no início
    salvarMedicoes();

    // Limpar formulário
    document.getElementById('medicaoForm').reset();
    document.getElementById('alertaTreino').style.display = 'none';

    // Atualizar interface
    renderizarHistorico();
    atualizarEstatisticas();

    // Feedback visual
    mostrarNotificacao('✅ Medição registrada com sucesso!');
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
        const data = new Date(medicao.dataHora);
        const dataFormatada = data.toLocaleDateString('pt-BR');
        const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const classeGlicemia = classificarGlicemia(medicao.glicemia);

        return `
            <div class="medicao-card">
                <div class="medicao-header">
                    <div>
                        <div class="medicao-momento">${momentosNomes[medicao.momento]}</div>
                        <div class="medicao-datetime">📅 ${dataFormatada} às ${horaFormatada}</div>
                    </div>
                    <button class="btn-delete" onclick="deletarMedicao(${medicao.id})">🗑️ Excluir</button>
                </div>
                <div class="medicao-body">
                    <div class="medicao-info">
                        <span class="medicao-label">Glicemia</span>
                        <span class="medicao-valor ${classeGlicemia}">${medicao.glicemia} mg/dL</span>
                    </div>
                    ${(medicao.unidadesInsulina > 0 || medicao.insulina > 0) ? `
                        <div class="medicao-info">
                            <span class="medicao-label">Insulina</span>
                            <span class="medicao-valor">
                                ${medicao.tipoInsulina || 'Não especificado'} - ${medicao.unidadesInsulina || medicao.insulina || 0} U
                            </span>
                        </div>
                    ` : ''}
                    ${medicao.anotacoes ? `
                        <div class="medicao-anotacoes">
                            <strong>📝 Anotações:</strong> ${medicao.anotacoes}
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
    const agora = new Date();
    const umDiaAtras = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
    const umaSemanAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const umMesAtras = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (filtroAtual) {
        case 'hoje':
            return medicoes.filter(m => new Date(m.dataHora) >= umDiaAtras);
        case 'semana':
            return medicoes.filter(m => new Date(m.dataHora) >= umaSemanAtras);
        case 'mes':
            return medicoes.filter(m => new Date(m.dataHora) >= umMesAtras);
        default:
            return medicoes;
    }
}

// Mudar filtro de período
function filtrarPeriodo(periodo) {
    filtroAtual = periodo;
    
    // Atualizar botões ativos
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    renderizarHistorico();
    atualizarEstatisticas();
}

// Deletar medição
function deletarMedicao(id) {
    if (confirm('Tem certeza que deseja excluir esta medição?')) {
        medicoes = medicoes.filter(m => m.id !== id);
        salvarMedicoes();
        renderizarHistorico();
        atualizarEstatisticas();
        mostrarNotificacao('🗑️ Medição excluída.');
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

    // Média geral
    const somaGeral = medicoesFiltradas.reduce((acc, m) => acc + m.glicemia, 0);
    const mediaGeral = Math.round(somaGeral / medicoesFiltradas.length);
    document.getElementById('mediaGeral').textContent = `${mediaGeral} mg/dL`;

    // Média em jejum (antes das refeições + antes de dormir)
    const jejum = medicoesFiltradas.filter(m => 
        m.momento.includes('-antes') || m.momento === 'antes-dormir'
    );
    if (jejum.length > 0) {
        const somaJejum = jejum.reduce((acc, m) => acc + m.glicemia, 0);
        const mediaJejum = Math.round(somaJejum / jejum.length);
        document.getElementById('mediaJejum').textContent = `${mediaJejum} mg/dL`;
    } else {
        document.getElementById('mediaJejum').textContent = '--';
    }

    // Média pós-prandial (depois das refeições)
    const posPrandial = medicoesFiltradas.filter(m => m.momento.includes('-depois'));
    if (posPrandial.length > 0) {
        const somaPosPrandial = posPrandial.reduce((acc, m) => acc + m.glicemia, 0);
        const mediaPosPrandial = Math.round(somaPosPrandial / posPrandial.length);
        document.getElementById('mediaPosPrandial').textContent = `${mediaPosPrandial} mg/dL`;
    } else {
        document.getElementById('mediaPosPrandial').textContent = '--';
    }

    // Total de medições
    document.getElementById('totalMedicoes').textContent = medicoesFiltradas.length;
}

// Salvar medições no localStorage
function salvarMedicoes() {
    localStorage.setItem('medicoes', JSON.stringify(medicoes));
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

    mostrarNotificacao('📥 Dados exportados em JSON com sucesso!');
}

// Exportar dados como PDF
function exportarPDF() {
    if (medicoes.length === 0) {
        alert('Não há dados para exportar.');
        return;
    }

    const medicoesFiltradas = filtrarMedicoes();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Título
    doc.setFontSize(20);
    doc.setTextColor(102, 126, 234);
    doc.text('Controle de Glicemia e Insulina', 105, 15, { align: 'center' });

    // Data do relatório
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 105, 22, { align: 'center' });

    // Estatísticas
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Estatísticas', 14, 35);

    const stats = calcularEstatisticas(medicoesFiltradas);
    doc.setFontSize(10);
    let yPos = 42;
    doc.text(`Total de Medições: ${medicoesFiltradas.length}`, 14, yPos);
    doc.text(`Média Geral: ${stats.mediaGeral} mg/dL`, 14, yPos + 6);
    doc.text(`Média em Jejum: ${stats.mediaJejum}`, 14, yPos + 12);
    doc.text(`Média Pós-Prandial: ${stats.mediaPosPrandial}`, 14, yPos + 18);
    doc.text(`Período: ${getFiltroTexto()}`, 14, yPos + 24);

    // Tabela de medições
    const tableData = medicoesFiltradas.map(medicao => {
        const data = new Date(medicao.dataHora);
        const unidades = medicao.unidadesInsulina || medicao.insulina || 0;
        const tipo = medicao.tipoInsulina || '';
        const insulinaTexto = unidades > 0 ? `${tipo ? tipo + ' - ' : ''}${unidades} U` : '-';
        return [
            data.toLocaleDateString('pt-BR'),
            data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            momentosNomes[medicao.momento].replace(/[^\w\s-]/g, ''),
            `${medicao.glicemia} mg/dL`,
            insulinaTexto,
            medicao.anotacoes || '-'
        ];
    });

    doc.autoTable({
        startY: yPos + 30,
        head: [['Data', 'Hora', 'Momento', 'Glicemia', 'Insulina', 'Anotações']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [102, 126, 234], textColor: 255 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 22 },
            1: { cellWidth: 18 },
            2: { cellWidth: 45 },
            3: { cellWidth: 25 },
            4: { cellWidth: 20 },
            5: { cellWidth: 50 }
        }
    });

    // Salvar PDF
    doc.save(`controle-glicemia-${new Date().toISOString().split('T')[0]}.pdf`);
    mostrarNotificacao('📄 PDF gerado com sucesso!');
}

// Exportar dados como Excel
function exportarExcel() {
    if (medicoes.length === 0) {
        alert('Não há dados para exportar.');
        return;
    }

    const medicoesFiltradas = filtrarMedicoes();

    // Preparar dados para Excel
    const dadosExcel = medicoesFiltradas.map(medicao => {
        const data = new Date(medicao.dataHora);
        return {
            'Data': data.toLocaleDateString('pt-BR'),
            'Hora': data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            'Momento': momentosNomes[medicao.momento],
            'Glicemia (mg/dL)': medicao.glicemia,
            'Tipo de Insulina': medicao.tipoInsulina || '',
            'Insulina (U)': medicao.unidadesInsulina || medicao.insulina || 0,
            'Anotações': medicao.anotacoes || ''
        };
    });

    // Criar estatísticas
    const stats = calcularEstatisticas(medicoesFiltradas);
    const estatisticas = [
        { 'Estatística': 'Total de Medições', 'Valor': medicoesFiltradas.length },
        { 'Estatística': 'Média Geral', 'Valor': stats.mediaGeral + ' mg/dL' },
        { 'Estatística': 'Média em Jejum', 'Valor': stats.mediaJejum },
        { 'Estatística': 'Média Pós-Prandial', 'Valor': stats.mediaPosPrandial },
        { 'Estatística': 'Período', 'Valor': getFiltroTexto() },
        { 'Estatística': 'Data do Relatório', 'Valor': new Date().toLocaleDateString('pt-BR') }
    ];

    // Criar workbook
    const wb = XLSX.utils.book_new();

    // Adicionar aba de medições
    const wsMedicoes = XLSX.utils.json_to_sheet(dadosExcel);
    XLSX.utils.book_append_sheet(wb, wsMedicoes, 'Medições');

    // Adicionar aba de estatísticas
    const wsStats = XLSX.utils.json_to_sheet(estatisticas);
    XLSX.utils.book_append_sheet(wb, wsStats, 'Estatísticas');

    // Salvar arquivo
    XLSX.writeFile(wb, `controle-glicemia-${new Date().toISOString().split('T')[0]}.xlsx`);
    mostrarNotificacao('📊 Excel gerado com sucesso!');
}

// Calcular estatísticas para exportação
function calcularEstatisticas(medicoesFiltradas) {
    if (medicoesFiltradas.length === 0) {
        return {
            mediaGeral: '--',
            mediaJejum: '--',
            mediaPosPrandial: '--'
        };
    }

    const somaGeral = medicoesFiltradas.reduce((acc, m) => acc + m.glicemia, 0);
    const mediaGeral = Math.round(somaGeral / medicoesFiltradas.length);

    const jejum = medicoesFiltradas.filter(m => 
        m.momento.includes('-antes') || m.momento === 'antes-dormir'
    );
    const mediaJejum = jejum.length > 0 
        ? Math.round(jejum.reduce((acc, m) => acc + m.glicemia, 0) / jejum.length) + ' mg/dL'
        : '--';

    const posPrandial = medicoesFiltradas.filter(m => m.momento.includes('-depois'));
    const mediaPosPrandial = posPrandial.length > 0 
        ? Math.round(posPrandial.reduce((acc, m) => acc + m.glicemia, 0) / posPrandial.length) + ' mg/dL'
        : '--';

    return { mediaGeral, mediaJejum, mediaPosPrandial };
}

// Obter texto do filtro atual
function getFiltroTexto() {
    switch (filtroAtual) {
        case 'hoje': return 'Hoje';
        case 'semana': return 'Última Semana';
        case 'mes': return 'Último Mês';
        default: return 'Todos os Registros';
    }
}

// Limpar todos os dados
function limparDados() {
    if (confirm('⚠️ ATENÇÃO! Isso irá apagar TODAS as medições. Deseja continuar?')) {
        if (confirm('Tem certeza absoluta? Esta ação não pode ser desfeita!')) {
            medicoes = [];
            salvarMedicoes();
            renderizarHistorico();
            atualizarEstatisticas();
            mostrarNotificacao('🗑️ Todos os dados foram apagados.');
        }
    }
}

// Mostrar notificação temporária
function mostrarNotificacao(mensagem) {
    const notificacao = document.createElement('div');
    notificacao.className = 'alert success';
    notificacao.innerHTML = `<p>${mensagem}</p>`;
    notificacao.style.position = 'fixed';
    notificacao.style.top = '20px';
    notificacao.style.right = '20px';
    notificacao.style.zIndex = '9999';
    notificacao.style.minWidth = '300px';
    notificacao.style.animation = 'slideIn 0.3s ease';

    document.body.appendChild(notificacao);

    setTimeout(() => {
        notificacao.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notificacao);
        }, 300);
    }, 3000);
}

// Adicionar estilos para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
