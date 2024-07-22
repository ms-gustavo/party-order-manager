 <p>O <strong>Gerenciador de Comanda</strong> é um aplicativo para gerenciar consumos em bares, permitindo adicionar pedidos, dividi-los entre pessoas e calcular o total da conta.</p>

  <h2>Instalação</h2>
    <p>Siga os passos abaixo para instalar e configurar o projeto:</p>
      <ol>
        <li><strong>Clone o repositório:</strong> <code>git clone https://github.com/ms-gustavo/party-order-manager.git</code></li>
        <li><strong>Instale as dependências:</strong> Navegue até o diretório do projeto e execute <code>npm install</code></li>
      </ol>
      <h2>Uso</h2>
      <p>Para iniciar o servidor de desenvolvimento, execute:</p>
      <code>npm run dev</code>
      <p>Acesse o aplicativo em <a href="http://localhost:5173">http://localhost:5173</a>.</p>
      <h2>Testes</h2>
      <p>O projeto utiliza Cypress para testes end-to-end. Para executar os testes:</p>
      <ol>
        <li><strong>Execute o Cypress:</strong> <code>npm run cy:open</code> ou <code>npm run cy:run</code></li>
        <li><strong>Selecione o teste desejado:</strong> Na interface do Cypress, escolha o teste que deseja executar.</li>
      </ol>
      <h3>Comandos Personalizados</h3>
      <p>Os seguintes comandos personalizados estão disponíveis para facilitar os testes:</p>
      <ul>
        <li><code>cy.checkPageHeader()</code> - Verifica se o cabeçalho da página está presente.</li>
        <li><code>cy.addSharedOrder(name, amount)</code> - Adiciona um pedido no container compartilhado.</li>
        <li><code>cy.addIndividualClient(name)</code> - Adiciona um cliente no container individual.</li>
        <li><code>cy.removeIndividualClient(index)</code> - Remove um cliente do container individual.</li>
        <li><code>cy.addOrderToClient(index, itemName, amount)</code> - Adiciona um item a um cliente específico.</li>
      </ul>
