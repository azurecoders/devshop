{{/*
Full name for any service
Usage: include "devshop.fullname" (dict "name" "frontend" "context" .)
*/}}
{{- define "devshop.fullname" -}}
{{- printf "%s-%s" .context.Release.Name .name | trunc 63 | trimSuffix "-" -}}
{{- end}}

{{/*
Common labels
*/}}
{{- define "devshop.labels" -}}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: devshop
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end }}

{{/*
Selector labels for a specific service
*/}}
{{- define "devshop.selectorLabels" -}}
app.kubernetes.io/name: {{ .name }}
app.kubernetes.io/instance: {{ .context.Release.Name }}
{{- end }}

{{/*
Full Image Path
Usage: include "devshop.image" (dict "service" .Values.frontend "image" .Values.image)
*/}}
{{- define "devshop.image" -}}
{{- $tag := default .image.tag .service.image.tag -}}
{{- printf "%s/%s/%s:%s" .image.registry .image.namespace .service.image.repository $tag -}}
{{- end }}

{{/*
MongoDB connection URI
*/}}
{{- define "devshop.mongodbUri" -}}
{{- $user := index .Values.mongodb.auth.usernames 0 -}}
{{- $pass := index .Values.mongodb.auth.passwords 0 -}}
{{- $db := index .Values.mongodb.auth.databases 0 -}}
{{- printf "mongodb://%s:%s@%s-mongodb:27017/%s" $user $pass .Release.Name $db -}}
{{- end -}}

{{/*
Redis connection URL
*/}}
{{- define "devshop.redisUrl" -}}
{{- printf "redis://:%s@%s-redis-master:6379" .Values.redis.auth.password .Release.Name -}}
{{- end -}}
