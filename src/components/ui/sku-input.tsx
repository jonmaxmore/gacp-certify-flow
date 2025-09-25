import * as React from "react"
import { X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SkuInputProps {
  value: string[]
  onChange: (skus: string[]) => void
  placeholder?: string
  maxItems?: number
  className?: string
}

export const SkuInput = React.forwardRef<HTMLDivElement, SkuInputProps>(
  ({ value = [], onChange, placeholder = "เพิ่ม SKU", maxItems = 10, className, ...props }, ref) => {
    const [inputValue, setInputValue] = React.useState("")

    const addSku = () => {
      const trimmed = inputValue.trim()
      if (trimmed && !value.includes(trimmed) && value.length < maxItems) {
        onChange([...value, trimmed])
        setInputValue("")
      }
    }

    const removeSku = (skuToRemove: string) => {
      onChange(value.filter(sku => sku !== skuToRemove))
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        addSku()
      }
    }

    return (
      <div ref={ref} className={cn("space-y-3", className)} {...props}>
        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={addSku}
            disabled={!inputValue.trim() || value.includes(inputValue.trim()) || value.length >= maxItems}
            size="sm"
            className="px-3"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* SKU Pills */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.map((sku) => (
              <Badge
                key={sku}
                variant="secondary"
                className="sku-pill group px-3 py-1 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <span>{sku}</span>
                <button
                  type="button"
                  onClick={() => removeSku(sku)}
                  className="ml-2 hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Helper Text */}
        <p className="text-xs text-muted-foreground">
          {value.length} / {maxItems} รายการ
        </p>
      </div>
    )
  }
)
SkuInput.displayName = "SkuInput"