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
        
        Task.Run(ReceiveMessageAsync);
        await SendMessageAsync();
        
        // Отправка сообщений
        async Task SendMessageAsync()
        {
            using UdpClient sender = new UdpClient();
            
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
                await sender.SendAsync(data, new IPEndPoint(localAddress, remotePort));
            }
        }
        
        // Прием сообщений
        async Task ReceiveMessageAsync()
        {
            using UdpClient receiver = new UdpClient(localPort);
            while (true)
            {
                // получаем данные
                var result = await receiver.ReceiveAsync();
                var message = Encoding.UTF8.GetString(result.Buffer);
                chat.NewMessage(message);
                
                Console.Write("Введите сообщение:\t");
            }
        }
    }
}