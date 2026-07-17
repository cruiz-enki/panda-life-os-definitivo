"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DateTimePicker({
  date,
  setDate,
  placeholder = "Seleccionar fecha y hora",
  className,
}: {
  date?: Date
  setDate: (date?: Date) => void
  placeholder?: string
  className?: string
}) {
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value
    if (!date) return
    const [hours, minutes] = time.split(":").map(Number)
    const newDate = new Date(date)
    newDate.setHours(hours)
    newDate.setMinutes(minutes)
    setDate(newDate)
  }

  const timeValue = date ? format(date, "HH:mm") : ""

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal h-10 px-4 py-2 rounded-xl bg-secondary border-border focus:ring-2 focus:ring-primary/20",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP", { locale: es }) : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              if (newDate) {
                if (date) {
                  newDate.setHours(date.getHours())
                  newDate.setMinutes(date.getMinutes())
                } else {
                  newDate.setHours(9) // Default to 9 AM
                  newDate.setMinutes(0)
                }
              }
              setDate(newDate)
            }}
            initialFocus
            locale={es}
          />
        </PopoverContent>
      </Popover>
      {date && (
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="time"
            value={timeValue}
            onChange={handleTimeChange}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 outline-none text-sm h-10"
          />
        </div>
      )}
    </div>
  )
}
