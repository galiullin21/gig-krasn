import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileJson, Archive, FileText, Play, CheckCircle, XCircle, AlertCircle, HardDrive, RefreshCw, Globe, Newspaper } from "lucide-react";

interface ArchiveEntry {
  title: string;
  url: string;
  year: number;
  issue_number: string;
  date: string;
  filename: string;
}

interface DocumentEntry {
  title: string;
  url: string;
  year: number;
  month: string;
  filename: string;
}

interface ImportLog {
  type: "success" | "error" | "warning" | "info";
  message: string;
  timestamp: Date;
}

// Парсинг русской даты в Date объект
const parseRussianDate = (dateStr: string, year: number): Date => {
  const months: Record<string, number> = {
    "января": 0, "февраля": 1, "марта": 2, "апреля": 3,
    "мая": 4, "июня": 5, "июля": 6, "августа": 7,
    "сентября": 8, "октября": 9, "ноября": 10, "декабря": 11
  };
  
  const parts = dateStr.toLowerCase().trim().split(" ");
  if (parts.length >= 2) {
    const day = parseInt(parts[0]);
    const month = months[parts[1]];
    if (!isNaN(day) && month !== undefined) {
      return new Date(year, month, day);
    }
  }
  return new Date(year, 0, 1);
};

// Определение типа файла по расширению
const getFileType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const typeMap: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
  };
  return typeMap[ext] || 'application/octet-stream';
};

export default function AdminMigration() {
  const { toast } = useToast();
  
  // Archives state
  const [archivesData, setArchivesData] = useState<ArchiveEntry[]>([]);
  const [archivesLoading, setArchivesLoading] = useState(false);
  
  // Documents state
  const [documentsData, setDocumentsData] = useState<DocumentEntry[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  
  // Import state
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [stats, setStats] = useState({ added: 0, skipped: 0, errors: 0 });

  // PDF Migration state
  const [pdfMigrating, setPdfMigrating] = useState(false);
  const [autoMigrating, setAutoMigrating] = useState(false);
  const [totalMigrated, setTotalMigrated] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [pdfStats, setPdfStats] = useState<{
    processed: number;
    success: number;
    errors: number;
    remaining: number;
    results: Array<{
      id: string;
      issue_number: string;
      year: number;
      status: string;
      oldUrl?: string;
      newUrl?: string;
      error?: string;
    }>;
  } | null>(null);
  const [allResults, setAllResults] = useState<Array<{
    id: string;
    issue_number: string;
    year: number;
    status: string;
    oldUrl?: string;
    newUrl?: string;
    error?: string;
  }>>([]);

  // Web scraping state
  const [scrapingPhase, setScrapingPhase] = useState<'idle' | 'discovering' | 'scraping' | 'importing'>('idle');
  const [discoveredUrls, setDiscoveredUrls] = useState<string[]>([]);
  const [scrapedArticles, setScrapedArticles] = useState<Array<{
    title: string;
    content: string;
    lead?: string;
    cover_image?: string;
    published_at: string;
    url: string;
    type: 'news' | 'blog';
  }>>([]);
  const [scrapeProgress, setScrapeProgress] = useState(0);
  const [scrapeStats, setScrapeStats] = useState({ total: 0, scraped: 0, skipped: 0, errors: 0 });
  const stopScrapingRef = useRef(false);

  // Ref to control stopping auto migration
  const stopMigrationRef = useRef(false);

  // Auto migration function
  const runAutoMigration = async () => {
    stopMigrationRef.current = false;
    setAutoMigrating(true);
    setTotalMigrated(0);
    setTotalErrors(0);
    setAllResults([]);
    
    let remaining = 999;
    let migrated = 0;
    let errors = 0;
    
    while (remaining > 0 && !stopMigrationRef.current) {
      try {
        const { data, error } = await supabase.functions.invoke("migrate-archives", {
          body: { limit: 2, offset: 0 }
        });
        
        if (error) {
          errors++;
          setTotalErrors(prev => prev + 1);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        
        remaining = data.remaining;
        migrated += data.success;
        errors += data.errors;
        
        setTotalMigrated(migrated);
        setTotalErrors(errors);
        setPdfStats(data);
        setAllResults(prev => [...prev, ...data.results]);
        
        if (remaining === 0) break;
        
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error("Migration error:", err);
        errors++;
        setTotalErrors(prev => prev + 1);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    setAutoMigrating(false);
    toast({
      title: "Миграция завершена!",
      description: `Всего мигрировано: ${migrated}, Ошибок: ${errors}`,
    });
  };

  const stopAutoMigration = () => {
    stopMigrationRef.current = true;
    setAutoMigrating(false);
  };

  const addLog = (type: ImportLog["type"], message: string) => {
    setLogs(prev => [...prev, { type, message, timestamp: new Date() }]);
  };

  // Загрузка JSON файла архивов
  const handleArchivesFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArchivesLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as ArchiveEntry[];
      setArchivesData(data);
      toast({
        title: "Файл загружен",
        description: `Найдено ${data.length} записей архивов`,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось прочитать JSON файл",
        variant: "destructive",
      });
    } finally {
      setArchivesLoading(false);
    }
  };

  // Загрузка JSON файла документов
  const handleDocumentsFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocumentsLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as DocumentEntry[];
      setDocumentsData(data);
      toast({
        title: "Файл загружен",
        description: `Найдено ${data.length} записей документов`,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось прочитать JSON файл",
        variant: "destructive",
      });
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Импорт архивов
  const importArchives = async () => {
    if (archivesData.length === 0) {
      toast({ title: "Нет данных", description: "Сначала загрузите JSON файл", variant: "destructive" });
      return;
    }

    setImporting(true);
    setProgress(0);
    setLogs([]);
    setStats({ added: 0, skipped: 0, errors: 0 });
    addLog("info", `Начинаем импорт ${archivesData.length} архивных выпусков...`);

    let added = 0, skipped = 0, errors = 0;

    for (let i = 0; i < archivesData.length; i++) {
      const entry = archivesData[i];
      
      try {
        // Проверяем, существует ли уже такой выпуск
        const { data: existing } = await supabase
          .from("newspaper_archive")
          .select("id")
          .eq("issue_number", entry.issue_number)
          .eq("year", entry.year)
          .single();

        if (existing) {
          skipped++;
          addLog("warning", `Пропущен: Выпуск №${entry.issue_number} (${entry.year}) уже существует`);
        } else {
          const issueDate = parseRussianDate(entry.date, entry.year);
          
          const { error } = await supabase
            .from("newspaper_archive")
            .insert({
              issue_number: entry.issue_number,
              year: entry.year,
              issue_date: issueDate.toISOString().split('T')[0],
              pdf_url: entry.url,
              cover_image: null,
            });

          if (error) {
            errors++;
            addLog("error", `Ошибка: Выпуск №${entry.issue_number} - ${error.message}`);
          } else {
            added++;
            addLog("success", `Добавлен: Выпуск №${entry.issue_number} (${entry.date} ${entry.year})`);
          }
        }
      } catch (error) {
        errors++;
        addLog("error", `Ошибка: ${(error as Error).message}`);
      }

      setProgress(Math.round(((i + 1) / archivesData.length) * 100));
      setStats({ added, skipped, errors });
    }

    addLog("info", `Импорт завершён. Добавлено: ${added}, Пропущено: ${skipped}, Ошибок: ${errors}`);
    setImporting(false);
    
    toast({
      title: "Импорт завершён",
      description: `Добавлено: ${added}, Пропущено: ${skipped}, Ошибок: ${errors}`,
    });
  };

  // Импорт документов
  const importDocuments = async () => {
    if (documentsData.length === 0) {
      toast({ title: "Нет данных", description: "Сначала загрузите JSON файл", variant: "destructive" });
      return;
    }

    setImporting(true);
    setProgress(0);
    setLogs([]);
    setStats({ added: 0, skipped: 0, errors: 0 });
    addLog("info", `Начинаем импорт ${documentsData.length} документов...`);

    let added = 0, skipped = 0, errors = 0;

    for (let i = 0; i < documentsData.length; i++) {
      const entry = documentsData[i];
      
      try {
        // Проверяем, существует ли уже такой документ по URL
        const { data: existing } = await supabase
          .from("documents")
          .select("id")
          .eq("file_url", entry.url)
          .single();

        if (existing) {
          skipped++;
          addLog("warning", `Пропущен: "${entry.title}" уже существует`);
        } else {
          const { error } = await supabase
            .from("documents")
            .insert({
              title: entry.title,
              file_url: entry.url,
              file_type: getFileType(entry.filename),
              description: null,
              category_id: null,
            });

          if (error) {
            errors++;
            addLog("error", `Ошибка: "${entry.title}" - ${error.message}`);
          } else {
            added++;
            addLog("success", `Добавлен: "${entry.title}"`);
          }
        }
      } catch (error) {
        errors++;
        addLog("error", `Ошибка: ${(error as Error).message}`);
      }

      setProgress(Math.round(((i + 1) / documentsData.length) * 100));
      setStats({ added, skipped, errors });
    }

    addLog("info", `Импорт завершён. Добавлено: ${added}, Пропущено: ${skipped}, Ошибок: ${errors}`);
    setImporting(false);
    
    toast({
      title: "Импорт завершён",
      description: `Добавлено: ${added}, Пропущено: ${skipped}, Ошибок: ${errors}`,
    });
  };

  const LogIcon = ({ type }: { type: ImportLog["type"] }) => {
    switch (type) {
      case "success": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error": return <XCircle className="h-4 w-4 text-destructive" />;
      case "warning": return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="font-condensed font-bold text-2xl md:text-3xl">Миграция данных</h1>
        <p className="text-muted-foreground mt-1">
          Импорт данных со старого сайта gig26.ru
        </p>
      </div>

      <Tabs defaultValue="web-scrape" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="web-scrape" className="gap-2">
            <Globe className="h-4 w-4" />
            Новости и блоги
          </TabsTrigger>
          <TabsTrigger value="pdf-migration" className="gap-2">
            <HardDrive className="h-4 w-4" />
            Миграция PDF
          </TabsTrigger>
          <TabsTrigger value="archives" className="gap-2">
            <Archive className="h-4 w-4" />
            Архивы газеты
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            Документы
          </TabsTrigger>
        </TabsList>

        {/* Web Scraping Tab */}
        <TabsContent value="web-scrape" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                Импорт новостей и блогов с gig26.ru
              </CardTitle>
              <CardDescription>
                Парсинг статей с ноября 2024 по январь 2025
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {scrapingPhase === 'idle' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Нажмите кнопку, чтобы начать поиск статей на старом сайте. 
                    Процесс состоит из 3 этапов: обнаружение URL-ов, парсинг контента, импорт в базу.
                  </p>
                  <Button
                    onClick={async () => {
                      setScrapingPhase('discovering');
                      setScrapeStats({ total: 0, scraped: 0, skipped: 0, errors: 0 });
                      setDiscoveredUrls([]);
                      setScrapedArticles([]);
                      addLog("info", "Начинаем поиск статей на gig26.ru...");

                      try {
                        const { data, error } = await supabase.functions.invoke('scrape-old-site', {
                          body: { action: 'discover' }
                        });

                        if (error) throw error;

                        const urls = data.urls || [];
                        setDiscoveredUrls(urls);
                        setScrapeStats(prev => ({ ...prev, total: urls.length }));
                        addLog("success", `Найдено ${urls.length} потенциальных статей`);
                        
                        if (urls.length > 0) {
                          setScrapingPhase('scraping');
                          // Start scraping
                          stopScrapingRef.current = false;
                          let scraped = 0;
                          let skipped = 0;
                          let errors = 0;
                          const articles: typeof scrapedArticles = [];

                          for (let i = 0; i < urls.length; i++) {
                            if (stopScrapingRef.current) break;

                            const url = urls[i];
                            try {
                              const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('scrape-old-site', {
                                body: { 
                                  action: 'scrape', 
                                  url,
                                  startMonth: '11',
                                  endMonth: '01',
                                  year: '2024'
                                }
                              });

                              if (scrapeError) {
                                errors++;
                                addLog("error", `Ошибка: ${url}`);
                              } else if (scrapeData.skipped) {
                                skipped++;
                              } else if (scrapeData.article && scrapeData.article.title) {
                                scraped++;
                                articles.push(scrapeData.article);
                                addLog("success", `Спарсено: ${scrapeData.article.title.substring(0, 50)}...`);
                              } else {
                                skipped++;
                              }
                            } catch (e) {
                              errors++;
                            }

                            setScrapeProgress(Math.round(((i + 1) / urls.length) * 100));
                            setScrapeStats({ total: urls.length, scraped, skipped, errors });
                            
                            // Small delay
                            await new Promise(r => setTimeout(r, 300));
                          }

                          setScrapedArticles(articles);
                          addLog("info", `Парсинг завершён. Спарсено: ${scraped}, Пропущено: ${skipped}, Ошибок: ${errors}`);
                          
                          if (articles.length > 0) {
                            setScrapingPhase('importing');
                          } else {
                            setScrapingPhase('idle');
                          }
                        } else {
                          setScrapingPhase('idle');
                        }
                      } catch (e) {
                        addLog("error", `Ошибка: ${(e as Error).message}`);
                        setScrapingPhase('idle');
                      }
                    }}
                    className="gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    Начать поиск статей
                  </Button>
                </div>
              )}

              {scrapingPhase === 'discovering' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Поиск URL-ов статей...</span>
                  </div>
                </div>
              )}

              {scrapingPhase === 'scraping' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Парсинг статей: {scrapeStats.scraped} / {scrapeStats.total}</span>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        stopScrapingRef.current = true;
                      }}
                    >
                      Остановить
                    </Button>
                  </div>
                  <Progress value={scrapeProgress} className="h-2" />
                  <div className="flex gap-2">
                    <Badge variant="default" className="bg-green-500">{scrapeStats.scraped} спарсено</Badge>
                    <Badge variant="secondary">{scrapeStats.skipped} пропущено</Badge>
                    <Badge variant="destructive">{scrapeStats.errors} ошибок</Badge>
                  </div>
                </div>
              )}

              {scrapingPhase === 'importing' && (
                <div className="space-y-4">
                  <p className="text-sm">
                    Найдено {scrapedArticles.length} статей для импорта.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        addLog("info", `Импорт ${scrapedArticles.length} статей...`);
                        
                        const newsArticles = scrapedArticles.filter(a => a.type === 'news');
                        const blogArticles = scrapedArticles.filter(a => a.type === 'blog');

                        // Import news
                        if (newsArticles.length > 0) {
                          const { data, error } = await supabase.functions.invoke('import-news', {
                            body: { news: newsArticles }
                          });
                          if (error) {
                            addLog("error", `Ошибка импорта новостей: ${error.message}`);
                          } else {
                            addLog("success", `Новости: добавлено ${data.inserted}, пропущено ${data.skipped}`);
                          }
                        }

                        // Import blogs
                        if (blogArticles.length > 0) {
                          const { data, error } = await supabase.functions.invoke('import-blogs', {
                            body: { blogs: blogArticles }
                          });
                          if (error) {
                            addLog("error", `Ошибка импорта блогов: ${error.message}`);
                          } else {
                            addLog("success", `Блоги: добавлено ${data.inserted}, пропущено ${data.skipped}`);
                          }
                        }

                        toast({
                          title: "Импорт завершён",
                          description: `Обработано ${scrapedArticles.length} статей`
                        });
                        setScrapingPhase('idle');
                      }}
                      className="gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Импортировать все
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setScrapingPhase('idle')}
                    >
                      Отмена
                    </Button>
                  </div>

                  <ScrollArea className="h-[200px] border rounded-md p-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Заголовок</TableHead>
                          <TableHead>Тип</TableHead>
                          <TableHead>Дата</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scrapedArticles.slice(0, 50).map((article, i) => (
                          <TableRow key={i}>
                            <TableCell className="max-w-[300px] truncate">{article.title}</TableCell>
                            <TableCell>
                              <Badge variant={article.type === 'news' ? 'default' : 'secondary'}>
                                {article.type === 'news' ? 'Новость' : 'Блог'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(article.published_at).toLocaleDateString('ru-RU')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PDF Migration */}
        <TabsContent value="pdf-migration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Миграция PDF файлов со старого сайта
              </CardTitle>
              <CardDescription>
                Скачивает PDF файлы с gig26.ru и загружает их на новый сервер.
                {pdfStats && (
                  <span className="block mt-2 font-medium text-foreground">
                    Осталось мигрировать: {pdfStats.remaining} файлов
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                {!autoMigrating ? (
                  <Button
                    onClick={runAutoMigration}
                    disabled={pdfMigrating}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Play className="h-4 w-4" />
                    Запустить автоматическую миграцию всех файлов
                  </Button>
                ) : (
                  <Button
                    onClick={stopAutoMigration}
                    variant="destructive"
                    className="gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Остановить миграцию
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={async () => {
                    setPdfMigrating(true);
                    try {
                      const { data, error } = await supabase.functions.invoke("migrate-archives", {
                        body: { limit: 2, offset: 0 }
                      });
                      
                      if (error) throw error;
                      setPdfStats(data);
                      
                      toast({
                        title: "Миграция завершена",
                        description: `Обработано: ${data.processed}, Успешно: ${data.success}, Ошибок: ${data.errors}`,
                      });
                    } catch (error) {
                      toast({
                        title: "Ошибка миграции",
                        description: (error as Error).message,
                        variant: "destructive",
                      });
                    } finally {
                      setPdfMigrating(false);
                    }
                  }}
                  disabled={pdfMigrating || autoMigrating}
                  className="gap-2"
                >
                  {pdfMigrating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Мигрировать 2 файла вручную
                </Button>
              </div>

              {autoMigrating && (
                <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="h-5 w-5 animate-spin text-green-600" />
                    <span className="font-medium text-green-700 dark:text-green-300">
                      Автоматическая миграция в процессе...
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span>Мигрировано: <strong>{totalMigrated}</strong></span>
                    <span>Ошибок: <strong>{totalErrors}</strong></span>
                    <span>Осталось: <strong>{pdfStats?.remaining || "?"}</strong></span>
                  </div>
                  {pdfStats?.remaining && (
                    <Progress 
                      value={totalMigrated / (totalMigrated + (pdfStats.remaining || 1)) * 100} 
                      className="mt-2 h-2" 
                    />
                  )}
                </div>
              )}

              {pdfStats && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Badge variant="default" className="bg-green-500">{pdfStats.success} успешно</Badge>
                    <Badge variant="destructive">{pdfStats.errors} ошибок</Badge>
                    <Badge variant="secondary">{pdfStats.remaining} осталось</Badge>
                  </div>
                  
                  <ScrollArea className="h-[300px] border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Год</TableHead>
                          <TableHead>№</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead>Новый URL</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pdfStats.results.map((result) => (
                          <TableRow key={result.id}>
                            <TableCell>{result.year}</TableCell>
                            <TableCell>{result.issue_number}</TableCell>
                            <TableCell>
                              {result.status === "success" ? (
                                <Badge className="bg-green-500">Успешно</Badge>
                              ) : result.status === "error" ? (
                                <Badge variant="destructive">{result.error}</Badge>
                              ) : (
                                <Badge variant="secondary">Пропущен</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                              {result.newUrl || result.error || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Архивы газеты */}
        <TabsContent value="archives" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5" />
                Загрузка файла archives.json
              </CardTitle>
              <CardDescription>
                Загрузите JSON файл с данными архивных выпусков газеты
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="archives-file">JSON файл</Label>
                  <Input
                    id="archives-file"
                    type="file"
                    accept=".json"
                    onChange={handleArchivesFileUpload}
                    disabled={archivesLoading || importing}
                  />
                </div>
                <Button
                  onClick={importArchives}
                  disabled={archivesData.length === 0 || importing}
                  className="gap-2 mt-6"
                >
                  <Play className="h-4 w-4" />
                  Импортировать
                </Button>
              </div>

              {archivesData.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{archivesData.length} записей</Badge>
                    <span className="text-sm text-muted-foreground">
                      Годы: {Math.min(...archivesData.map(a => a.year))} - {Math.max(...archivesData.map(a => a.year))}
                    </span>
                  </div>
                  
                  <ScrollArea className="h-[200px] border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>№</TableHead>
                          <TableHead>Дата</TableHead>
                          <TableHead>Год</TableHead>
                          <TableHead>Файл</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {archivesData.slice(0, 20).map((entry, i) => (
                          <TableRow key={i}>
                            <TableCell>{entry.issue_number}</TableCell>
                            <TableCell>{entry.date}</TableCell>
                            <TableCell>{entry.year}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                              {entry.filename}
                            </TableCell>
                          </TableRow>
                        ))}
                        {archivesData.length > 20 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              ... и ещё {archivesData.length - 20} записей
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Документы */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5" />
                Загрузка файла documents.json
              </CardTitle>
              <CardDescription>
                Загрузите JSON файл с данными документов
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="documents-file">JSON файл</Label>
                  <Input
                    id="documents-file"
                    type="file"
                    accept=".json"
                    onChange={handleDocumentsFileUpload}
                    disabled={documentsLoading || importing}
                  />
                </div>
                <Button
                  onClick={importDocuments}
                  disabled={documentsData.length === 0 || importing}
                  className="gap-2 mt-6"
                >
                  <Play className="h-4 w-4" />
                  Импортировать
                </Button>
              </div>

              {documentsData.length > 0 && (
                <div className="space-y-2">
                  <Badge variant="secondary">{documentsData.length} записей</Badge>
                  
                  <ScrollArea className="h-[200px] border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Название</TableHead>
                          <TableHead>Год</TableHead>
                          <TableHead>Файл</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documentsData.slice(0, 20).map((entry, i) => (
                          <TableRow key={i}>
                            <TableCell className="max-w-[300px] truncate">{entry.title}</TableCell>
                            <TableCell>{entry.year}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                              {entry.filename}
                            </TableCell>
                          </TableRow>
                        ))}
                        {documentsData.length > 20 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                              ... и ещё {documentsData.length - 20} записей
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Прогресс и логи импорта */}
      {(importing || logs.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Прогресс импорта</span>
              <div className="flex gap-2">
                <Badge variant="default" className="bg-green-500">{stats.added} добавлено</Badge>
                <Badge variant="secondary">{stats.skipped} пропущено</Badge>
                <Badge variant="destructive">{stats.errors} ошибок</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-center text-muted-foreground">{progress}%</p>
            
            <ScrollArea className="h-[200px] border rounded-md p-2">
              <div className="space-y-1">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <LogIcon type={log.type} />
                    <span className="text-xs text-muted-foreground">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <span className={log.type === "error" ? "text-destructive" : ""}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
