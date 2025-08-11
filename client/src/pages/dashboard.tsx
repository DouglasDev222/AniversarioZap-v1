import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: api.stats.get,
  });

  const { data: employees } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: api.employees.getAll,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  const getDaysUntilText = (days: number) => {
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Amanhã';
    return `Em ${days} dias`;
  };

  const getDaysColor = (days: number) => {
    if (days === 0) return 'text-red-600';
    if (days === 1) return 'text-orange-600';
    if (days <= 3) return 'text-green-600';
    return 'text-blue-600';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Agora mesmo';
    if (diffHours < 24) return `Há ${diffHours} horas`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total de Colaboradores</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.totalEmployees || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-users text-blue-600"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Aniversários este Mês</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.thisMonthBirthdays || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-birthday-cake text-green-600"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Aniversários Hoje</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.todayBirthdays || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-gift text-orange-600"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Mensagens Enviadas</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.messagesSent || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-whatsapp text-purple-600"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Birthdays */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Próximos Aniversários
              </CardTitle>
              <span className="text-sm text-gray-500">Próximos 7 dias</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.upcomingBirthdays?.length > 0 ? (
                stats.upcomingBirthdays.map((item: any) => (
                  <div 
                    key={item.employee.id} 
                    className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {getInitials(item.employee.name)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.employee.name}</p>
                      <p className="text-sm text-gray-500">{item.employee.position}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(item.date)}
                      </p>
                      <p className={`text-xs ${getDaysColor(item.daysUntil)}`}>
                        {getDaysUntilText(item.daysUntil)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-calendar-alt text-4xl mb-2"></i>
                  <p>Nenhum aniversário nos próximos 7 dias</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Mensagens Recentes
              </CardTitle>
              <span className="text-sm text-gray-500">Últimas 24h</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentMessages?.length > 0 ? (
                stats.recentMessages.map((message: any) => {
                  const employee = employees?.find(emp => emp.id === message.employeeId);
                  const isSuccess = message.status === 'sent';
                  
                  return (
                    <div 
                      key={message.id} 
                      className="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div className={`w-8 h-8 ${isSuccess ? 'bg-green-100' : 'bg-yellow-100'} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <i className={`fas ${isSuccess ? 'fa-whatsapp text-green-600' : 'fa-clock text-yellow-600'} text-sm`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">
                          {message.content.substring(0, 50)}...
                        </p>
                        <p className="text-xs text-gray-500">
                          {message.sentAt ? formatTimestamp(message.sentAt) : 'Agendado'}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        isSuccess ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {isSuccess ? 'Enviado' : 'Agendado'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-message text-4xl mb-2"></i>
                  <p>Nenhuma mensagem recente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
