using System.Net;
using System.Net.Sockets;
using System.Text;

namespace Client;

internal class Message
{
    public Message(string? text)
    {
        Text = text;
    }

    public string? Text { get; }
    public DateTime Timestamp { get; } = DateTime.Now;
}

internal class Chat
{
    private List<Message> History { get; } = new();

    // Синхронизация истории чата
    public void Fetch()
    {
        History.Sort((a, b) => a.Timestamp.CompareTo(b.Timestamp));
        Console.Clear();
        foreach (var message in History)
        {
            Console.WriteLine("[{0}]\t {1}", message.Timestamp.TimeOfDay, message.Text);
        }
    }

    public void NewMessage(string text)
    {
        History.Add(new Message(text));
        Fetch();
    }
}

class Program
{
    private static async Task Main()
    {
        var chat = new Chat();
        var localAddress = IPAddress.Parse("127.0.0.1");
        
        Console.Write("Введите имя пользователя: ");
        var username = Console.ReadLine();
        if (string.IsNullOrWhiteSpace(username)) return;
        
        Console.Write("Введите порт для приема сообщений: ");
        if (!int.TryParse(Console.ReadLine(), out var localPort)) return;
        
        Console.Write("Введите порт для отправки сообщений: ");
        if (!int.TryParse(Console.ReadLine(), out var remotePort)) return;
        Console.Clear();

        // TCP подключение
        await ConnectToChat();
        
        // UDP чат
        Task.Run(ReceiveMessageAsync);
        await SendMessageAsync();
        
        // Отправка сообщений
        async Task ConnectToChat()
        {
            Console.WriteLine("Ожидание подключения...");

            var tcpClient = new TcpClient();
            TcpListener listener = new TcpListener(localAddress, localPort);
            listener.Start();
            
            while (true)
            {
                try
                {
                    await tcpClient.ConnectAsync(localAddress, remotePort);
                    Console.Clear();
                    break;
                }
                catch
                {
                    // ignored
                }
            }

        }
        async Task SendMessageAsync()
        {
            using var sender = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp);
            
            while (true)
            {
                Console.Write("Введите сообщение:\t");
                var message = Console.ReadLine();

                if (string.IsNullOrWhiteSpace(message))
                {
                    chat.Fetch();
                    continue;
                }
                if (message.Equals("/exit")) break;
                
                message = $"{username}: {message}";
                chat.NewMessage(message);
                byte[] data = Encoding.UTF8.GetBytes(message);
                await sender.SendToAsync(data, SocketFlags.None, new IPEndPoint(localAddress, remotePort));
            }
        }
        
        // Прием сообщений
        async Task ReceiveMessageAsync()
        {
            var data = new byte[65535];
            using var receiver = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp);
            receiver.Bind(new IPEndPoint(localAddress, localPort));

            while (true)
            {
                // получаем данные
                var result = await receiver.ReceiveFromAsync(data, SocketFlags.None, new IPEndPoint(localAddress, remotePort));
                var message = Encoding.UTF8.GetString(data, 0, result.ReceivedBytes);
                chat.NewMessage(message);
                
                Console.Write("Введите сообщение:\t");
            }
        }
    }
}