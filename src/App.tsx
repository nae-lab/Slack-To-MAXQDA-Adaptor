import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ExportForm } from '@/components/ExportForm'

function App() {
  const { t, i18n } = useTranslation()

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{t("app.title")}</h1>
            <p className="text-muted-foreground mt-2">{t("app.description")}</p>
          </div>

          <Select value={i18n.language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[140px]">
              <Languages className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ja">日本語</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ExportForm />
        {/* <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">{t('export.single')}</TabsTrigger>
            <TabsTrigger value="multiple" disabled>{t('export.multiple')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="mt-6">
          </TabsContent>
          
          <TabsContent value="multiple" className="mt-6">
            <div className="text-center text-muted-foreground py-12">
              Multiple channel export coming soon...
            </div>
          </TabsContent>
        </Tabs> */}
      </div>
    </div>
  );
}

export default App